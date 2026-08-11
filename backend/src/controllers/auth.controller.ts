import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/errors";
import { loginSchema } from "../validators/auth.validators";
import { signToken } from "../middleware/auth";

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw ApiError.unauthorized("Invalid email or password");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized("Invalid email or password");

  const token = signToken({ userId: user.id, role: user.role, email: user.email });

  res.status(200).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!user) throw ApiError.notFound("User not found");
  res.status(200).json(user);
}
