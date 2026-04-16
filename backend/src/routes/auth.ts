import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  comparePassword,
  generateVerificationToken,
  hashPassword,
  hashVerificationToken,
  signSessionToken,
} from "../lib/auth.js";
import { sendVerificationEmail } from "../lib/mailer.js";
import { config, isProduction } from "../config.js";
import { requireAuth } from "../middlewares/auth.js";

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const registerSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter").transform((value) => value.trim()),
    npm: z.string().min(3, "NPM minimal 3 karakter").transform((value) => value.trim()),
    email: z.email().transform((value) => value.toLowerCase().trim()),
    password: z.string().regex(passwordRegex, {
      message:
        "Password minimal 8 karakter dan harus mengandung huruf, angka, serta simbol.",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak sama.",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase().trim()),
  password: z.string().min(1),
});

export const authRoutes = async (app: FastifyInstance) => {
  app.post("/api/auth/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Validasi gagal",
        errors: parsed.error.flatten(),
      });
    }

    const { name, npm, email, password } = parsed.data;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { npm }],
      },
    });
    if (existingUser) {
      return reply.status(409).send({ message: existingUser.email === email ? "Email sudah terdaftar" : "NPM sudah terdaftar" });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        npm,
        email,
        password: hashedPassword,
      },
    });

    const rawToken = generateVerificationToken();
    const tokenHash = hashVerificationToken(rawToken);

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    const verificationUrl = `${config.frontendUrl}/verify-email/${rawToken}`;
    await sendVerificationEmail(email, verificationUrl);

    return reply.status(201).send({
      message: "Registrasi berhasil. Cek email untuk verifikasi akun.",
    });
  });

  app.get<{ Params: { token: string } }>("/verify-email/:token", async (request, reply) => {
    const tokenHash = hashVerificationToken(request.params.token);

    const verification = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!verification) {
      return reply.status(400).send({ message: "Token verifikasi tidak valid" });
    }

    if (verification.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({ where: { id: verification.id } });
      return reply.status(400).send({ message: "Token verifikasi sudah kedaluwarsa" });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: verification.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      prisma.emailVerificationToken.deleteMany({ where: { userId: verification.userId } }),
    ]);

    return reply.send({
      message: "Email berhasil diverifikasi. Silakan login untuk melanjutkan.",
      success: true,
    });
  });

  app.post("/api/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ message: "Email dan password wajib diisi" });
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return reply.status(401).send({ message: "Email atau password salah" });
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return reply.status(401).send({ message: "Email atau password salah" });
    }

    if (!user.emailVerifiedAt) {
      return reply.status(403).send({ message: "Email belum diverifikasi" });
    }

    const token = signSessionToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    reply.setCookie(config.cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return reply.send({
      message: "Login berhasil",
      user: {
        id: user.id,
        name: user.name,
        npm: user.npm,
        email: user.email,
        role: user.role,
      },
    });
  });

  app.post("/api/auth/logout", async (_, reply) => {
    reply.clearCookie(config.cookieName, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
    });

    reply.setCookie(config.cookieName, "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      expires: new Date(0),
      maxAge: 0,
    });

    return reply.send({ message: "Logout berhasil" });
  });

  app.get("/api/auth/me", { preHandler: [requireAuth] }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      select: { id: true, name: true, npm: true, email: true, role: true, emailVerifiedAt: true },
    });

    if (!user) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    return reply.send({ user });
  });
};
