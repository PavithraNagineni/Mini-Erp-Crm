import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/errors";
import { getPagination, buildPaginationMeta } from "../lib/pagination";
import { createProductSchema, stockMovementSchema, updateProductSchema } from "../validators/product.validators";

export async function createProduct(req: Request, res: Response) {
  const data = createProductSchema.parse(req.body);

  const product = await prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      category: data.category || null,
      unitPrice: data.unitPrice,
      currentStock: data.currentStock ?? 0,
      minStockAlert: data.minStockAlert ?? 0,
      location: data.location || null,
    },
  });

  res.status(201).json(product);
}

export async function listProducts(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req);
  const search = String(req.query.search ?? "").trim();
  const lowStockOnly = req.query.lowStock === "true";

  const where: Prisma.ProductWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
            { category: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [allMatching, total] = await Promise.all([
    prisma.product.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.product.count({ where }),
  ]);

  const items = lowStockOnly ? allMatching.filter((p) => p.currentStock <= p.minStockAlert) : allMatching;

  res.status(200).json({
    data: items.map((p) => ({ ...p, isLowStock: p.currentStock <= p.minStockAlert })),
    ...buildPaginationMeta(total, page, limit),
  });
}

export async function getProduct(req: Request, res: Response) {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) throw ApiError.notFound("Product not found");
  res.status(200).json({ ...product, isLowStock: product.currentStock <= product.minStockAlert });
}

export async function updateProduct(req: Request, res: Response) {
  const data = updateProductSchema.parse(req.body);

  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) throw ApiError.notFound("Product not found");

  const product = await prisma.product.update({ where: { id: req.params.id }, data });
  res.status(200).json(product);
}

export async function addStockMovement(req: Request, res: Response) {
  const input = stockMovementSchema.parse(req.body);

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: req.params.id } });
    if (!product) throw ApiError.notFound("Product not found");

    const delta = input.movementType === "IN" ? input.quantityChanged : -input.quantityChanged;
    const newStock = product.currentStock + delta;

    if (newStock < 0) {
      throw ApiError.badRequest(
        `Insufficient stock for ${product.name}. Current stock: ${product.currentStock}, attempted OUT: ${input.quantityChanged}`
      );
    }

    const updated = await tx.product.update({
      where: { id: product.id },
      data: { currentStock: newStock },
    });

    const movement = await tx.stockMovement.create({
      data: {
        productId: product.id,
        quantityChanged: input.quantityChanged,
        movementType: input.movementType,
        reason: input.reason,
        createdById: req.user!.userId,
      },
    });

    return { product: updated, movement };
  });

  res.status(201).json(result);
}

export async function listStockMovements(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req);

  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) throw ApiError.notFound("Product not found");

  const where = { productId: req.params.id };
  const [items, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { id: true, name: true } } },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  res.status(200).json({ data: items, ...buildPaginationMeta(total, page, limit) });
}
