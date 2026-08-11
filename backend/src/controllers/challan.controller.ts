import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/errors";
import { getPagination, buildPaginationMeta } from "../lib/pagination";
import { createChallanSchema, updateChallanSchema } from "../validators/challan.validators";

// Generates a challan number like CH-2026-000123 based on a running count for the year.
// Wrapped inside the caller's transaction so numbering stays consistent under concurrency.
async function generateChallanNumber(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.challan.count({
    where: { challanNumber: { startsWith: `CH-${year}-` } },
  });
  const next = (count + 1).toString().padStart(6, "0");
  return `CH-${year}-${next}`;
}

export async function createChallan(req: Request, res: Response) {
  const input = createChallanSchema.parse(req.body);

  const result = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) throw ApiError.badRequest("Customer not found");

    const productIds = input.items.map((i) => i.productId);
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missing = productIds.filter((id) => !foundIds.has(id));
      throw ApiError.badRequest("One or more products not found", { missingProductIds: missing });
    }

    const challanNumber = await generateChallanNumber(tx);
    const totalQuantity = input.items.reduce((sum, i) => sum + i.quantity, 0);

    const challan = await tx.challan.create({
      data: {
        challanNumber,
        customerId: input.customerId,
        status: "DRAFT",
        totalQuantity,
        createdById: req.user!.userId,
        items: {
          create: input.items.map((item) => {
            const product = products.find((p) => p.id === item.productId)!;
            return {
              productId: product.id,
              productNameSnapshot: product.name,
              productSkuSnapshot: product.sku,
              unitPriceSnapshot: product.unitPrice,
              quantity: item.quantity,
            };
          }),
        },
      },
      include: { items: true, customer: true },
    });

    return challan;
  });

  res.status(201).json(result);
}

export async function updateChallan(req: Request, res: Response) {
  const input = updateChallanSchema.parse(req.body);

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.challan.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Challan not found");
    if (existing.status !== "DRAFT") {
      throw ApiError.badRequest(`Only DRAFT challans can be edited (current status: ${existing.status})`);
    }

    if (input.items) {
      const productIds = input.items.map((i) => i.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      if (products.length !== productIds.length) {
        throw ApiError.badRequest("One or more products not found");
      }

      await tx.challanItem.deleteMany({ where: { challanId: existing.id } });
      await tx.challanItem.createMany({
        data: input.items.map((item) => {
          const product = products.find((p) => p.id === item.productId)!;
          return {
            challanId: existing.id,
            productId: product.id,
            productNameSnapshot: product.name,
            productSkuSnapshot: product.sku,
            unitPriceSnapshot: product.unitPrice,
            quantity: item.quantity,
          };
        }),
      });
    }

    const totalQuantity = input.items ? input.items.reduce((s, i) => s + i.quantity, 0) : undefined;

    const updated = await tx.challan.update({
      where: { id: existing.id },
      data: {
        customerId: input.customerId,
        totalQuantity,
      },
      include: { items: true, customer: true },
    });

    return updated;
  });

  res.status(200).json(result);
}

export async function listChallans(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req);
  const status = req.query.status ? String(req.query.status) : undefined;
  const customerId = req.query.customerId ? String(req.query.customerId) : undefined;

  const where: Prisma.ChallanWhereInput = {
    ...(status ? { status: status as never } : {}),
    ...(customerId ? { customerId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.challan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { id: true, name: true, businessName: true } } },
    }),
    prisma.challan.count({ where }),
  ]);

  res.status(200).json({ data: items, ...buildPaginationMeta(total, page, limit) });
}

export async function getChallan(req: Request, res: Response) {
  const challan = await prisma.challan.findUnique({
    where: { id: req.params.id },
    include: {
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      customer: true,
      createdBy: { select: { id: true, name: true } },
    },
  });
  if (!challan) throw ApiError.notFound("Challan not found");
  res.status(200).json(challan);
}

// The critical business-rule endpoint: confirming a challan must atomically
// verify sufficient stock for every line item and deduct it, or fail entirely.
export async function confirmChallan(req: Request, res: Response) {
  const result = await prisma.$transaction(async (tx) => {
    const challan = await tx.challan.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!challan) throw ApiError.notFound("Challan not found");
    if (challan.status !== "DRAFT") {
      throw ApiError.badRequest(`Only DRAFT challans can be confirmed (current status: ${challan.status})`);
    }
    if (challan.items.length === 0) {
      throw ApiError.badRequest("Cannot confirm a challan with no line items");
    }

    // Re-fetch current stock inside the transaction (not from the challan snapshot)
    // so we check against the live figure, not what it was when the draft was created.
    const productIds = challan.items.map((i) => i.productId);
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const insufficient: { productId: string; name: string; available: number; requested: number }[] = [];
    for (const item of challan.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        insufficient.push({ productId: item.productId, name: item.productNameSnapshot, available: 0, requested: item.quantity });
        continue;
      }
      if (product.currentStock < item.quantity) {
        insufficient.push({
          productId: product.id,
          name: product.name,
          available: product.currentStock,
          requested: item.quantity,
        });
      }
    }

    if (insufficient.length > 0) {
      throw ApiError.badRequest("Insufficient stock for one or more products", { insufficient });
    }

    // All checks passed inside the same transaction -> safe to deduct.
    for (const item of challan.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantityChanged: item.quantity,
          movementType: "OUT",
          reason: `Challan ${challan.challanNumber} confirmed`,
          createdById: req.user!.userId,
        },
      });
    }

    const confirmed = await tx.challan.update({
      where: { id: challan.id },
      data: { status: "CONFIRMED" },
      include: { items: true, customer: true },
    });

    return confirmed;
  });

  res.status(200).json(result);
}

export async function cancelChallan(req: Request, res: Response) {
  const result = await prisma.$transaction(async (tx) => {
    const challan = await tx.challan.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!challan) throw ApiError.notFound("Challan not found");
    if (challan.status === "CANCELLED") {
      throw ApiError.badRequest("Challan is already cancelled");
    }

    // Assumption: cancelling a CONFIRMED challan restocks the products it had
    // deducted, since the goods are treated as not actually shipped. This is
    // documented as an assumption in the README.
    if (challan.status === "CONFIRMED") {
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantityChanged: item.quantity,
            movementType: "IN",
            reason: `Challan ${challan.challanNumber} cancelled - stock reverted`,
            createdById: req.user!.userId,
          },
        });
      }
    }

    return tx.challan.update({
      where: { id: challan.id },
      data: { status: "CANCELLED" },
      include: { items: true, customer: true },
    });
  });

  res.status(200).json(result);
}
