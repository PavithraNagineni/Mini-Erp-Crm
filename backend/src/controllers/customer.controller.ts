import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/errors";
import { getPagination, buildPaginationMeta } from "../lib/pagination";
import {
  addCustomerNoteSchema,
  createCustomerSchema,
  updateCustomerSchema,
} from "../validators/customer.validators";

export async function createCustomer(req: Request, res: Response) {
  const data = createCustomerSchema.parse(req.body);

  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      mobile: data.mobile,
      email: data.email || null,
      businessName: data.businessName || null,
      gstNumber: data.gstNumber || null,
      customerType: data.customerType,
      address: data.address || null,
      status: data.status ?? "LEAD",
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
    },
  });

  res.status(201).json(customer);
}

export async function listCustomers(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req);
  const search = String(req.query.search ?? "").trim();
  const status = req.query.status ? String(req.query.status) : undefined;
  const customerType = req.query.customerType ? String(req.query.customerType) : undefined;

  const where: Prisma.CustomerWhereInput = {
    ...(status ? { status: status as never } : {}),
    ...(customerType ? { customerType: customerType as never } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { mobile: { contains: search, mode: "insensitive" } },
            { businessName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.customer.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.customer.count({ where }),
  ]);

  res.status(200).json({ data: items, ...buildPaginationMeta(total, page, limit) });
}

export async function getCustomer(req: Request, res: Response) {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: {
      notes: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { id: true, name: true } } } },
      challans: { orderBy: { createdAt: "desc" }, select: { id: true, challanNumber: true, status: true, totalQuantity: true, createdAt: true } },
    },
  });
  if (!customer) throw ApiError.notFound("Customer not found");
  res.status(200).json(customer);
}

export async function updateCustomer(req: Request, res: Response) {
  const data = updateCustomerSchema.parse(req.body);

  const existing = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!existing) throw ApiError.notFound("Customer not found");

  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data: {
      ...data,
      email: data.email !== undefined ? data.email || null : undefined,
      followUpDate: data.followUpDate !== undefined ? (data.followUpDate ? new Date(data.followUpDate) : null) : undefined,
    },
  });

  res.status(200).json(customer);
}

export async function addCustomerNote(req: Request, res: Response) {
  const { note } = addCustomerNoteSchema.parse(req.body);

  const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!customer) throw ApiError.notFound("Customer not found");

  const created = await prisma.customerNote.create({
    data: {
      customerId: customer.id,
      note,
      createdById: req.user!.userId,
    },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  res.status(201).json(created);
}
