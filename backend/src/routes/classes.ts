import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middlewares/auth.js";
import crypto from "crypto";

const createClassSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
});

const joinClassSchema = z.object({
  inviteCode: z.string().min(1),
});

export const classRoutes = async (app: FastifyInstance) => {
  app.post(
    "/api/classes",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const parsed = createClassSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ message: "Validasi gagal", errors: parsed.error.flatten() });
      }

      // Generate 6 karakter unik
      const inviteCode = crypto.randomBytes(4).toString("hex").substring(0, 6).toUpperCase();

      const newClass = await prisma.class.create({
        data: {
          name: parsed.data.name,
          description: parsed.data.description,
          inviteCode,
          teacherId: request.user!.id,
        },
      });

      return reply.status(201).send(newClass);
    }
  );

  app.get("/api/classes", { preHandler: [requireAuth] }, async (request, reply) => {
    const teaching = await prisma.class.findMany({
      where: { teacherId: request.user!.id },
      include: { teacher: { select: { id: true, name: true, npm: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    const enrollments = await prisma.classEnrollment.findMany({
      where: { studentId: request.user!.id },
      include: { class: { include: { teacher: { select: { id: true, name: true, npm: true, email: true } } } } },
      orderBy: { enrolledAt: "desc" },
    });

    return reply.send({
      teaching,
      joined: enrollments.map((enrollment) => enrollment.class),
    });
  });

  app.post(
    "/api/classes/join",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const parsed = joinClassSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ message: "Kode kelas wajib diisi" });
      }

      const targetClass = await prisma.class.findUnique({
        where: { inviteCode: parsed.data.inviteCode.toUpperCase() },
      });

      if (!targetClass) {
        return reply.status(404).send({ message: "Kelas tidak ditemukan" });
      }

      if (targetClass.teacherId === request.user!.id) {
        return reply.status(400).send({ message: "Anda tidak bisa mengikuti kelas buatan sendiri" });
      }

      const existing = await prisma.classEnrollment.findUnique({
        where: {
          classId_studentId: {
            classId: targetClass.id,
            studentId: request.user!.id,
          },
        },
      });

      if (existing) {
        return reply.status(400).send({ message: "Anda sudah terdaftar di kelas ini" });
      }

      const enrollment = await prisma.classEnrollment.create({
        data: {
          classId: targetClass.id,
          studentId: request.user!.id,
        },
        include: { class: true },
      });

      return reply.send({ message: "Berhasil bergabung ke kelas", class: enrollment.class });
    }
  );

  app.get<{ Params: { id: string } }>(
    "/api/classes/:id",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { id } = request.params;

      const isTeacher = await prisma.class.findFirst({
        where: { id, teacherId: request.user!.id },
        select: { id: true },
      });

      const examsQuery = isTeacher
        ? {
            where: {},
            orderBy: { startTime: "asc" as const },
          }
        : {
            where: { isPublished: true },
            orderBy: { startTime: "asc" as const },
            include: {
              attempts: {
                where: { studentId: request.user!.id },
                select: {
                  status: true,
                  submittedAt: true,
                  score: true,
                  comment: true,
                },
              },
            },
          };

      const targetClass = await prisma.class.findUnique({
        where: { id },
        include: {
          exams: examsQuery,
          teacher: { select: { id: true, name: true, npm: true, email: true } },
          _count: { select: { enrollments: true } },
        },
      });

      if (!targetClass) {
        return reply.status(404).send({ message: "Kelas tidak ditemukan" });
      }

      if (targetClass.teacherId !== request.user!.id) {
        const checkEnroll = await prisma.classEnrollment.findUnique({
          where: { classId_studentId: { classId: id, studentId: request.user!.id } },
        });
        if (!checkEnroll) {
          return reply.status(403).send({ message: "Anda tidak memiliki akses ke kelas ini" });
        }
      }

      return reply.send(targetClass);
    }
  );

  app.get<{ Params: { id: string } }>(
    "/api/classes/:id/students",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { id } = request.params;
      const targetClass = await prisma.class.findUnique({
        where: { id, teacherId: request.user!.id },
      });

      if (!targetClass) {
        return reply.status(404).send({ message: "Akses ditolak / Kelas tidak ditemukan" });
      }

      if (targetClass.teacherId !== request.user!.id) {
        return reply.status(403).send({ message: "Akses ditolak" });
      }

      const students = await prisma.classEnrollment.findMany({
        where: { classId: id },
        include: { student: { select: { id: true, name: true, npm: true, email: true } } },
      });

      return reply.send(students.map((enrollment) => enrollment.student));
    }
  );

  app.delete<{ Params: { id: string } }>(
    "/api/classes/:id",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { id } = request.params;

      const targetClass = await prisma.class.findUnique({
        where: { id },
      });

      if (!targetClass) {
        return reply.status(404).send({ message: "Kelas tidak ditemukan" });
      }

      if (targetClass.teacherId !== request.user!.id) {
        return reply.status(403).send({ message: "Akses ditolak" });
      }

      await prisma.class.delete({
        where: { id },
      });

      return reply.send({ message: "Kelas berhasil dihapus" });
    }
  );
};
