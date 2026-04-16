import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middlewares/auth.js";
import { parseISO, isAfter, isBefore } from "date-fns";

const createExamSchema = z.object({
  title: z.string().min(3, "Judul ujian minimal 3 karakter"),
  description: z.string().min(1, "Soal/Deskripsi ujian wajib diisi"),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Waktu mulai tidak valid" }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Waktu selesai tidak valid" }),
  durationLimit: z.number().int().min(1).optional().nullable(),
  isPublished: z.boolean().default(false),
});

const gradeAttemptSchema = z.object({
  score: z.number().int().min(0).max(100).optional().nullable(),
  comment: z.string().max(5000).optional().nullable(),
});

export const examRoutes = async (app: FastifyInstance) => {

  app.post<{ Params: { classId: string } }>(
    "/api/classes/:classId/exams",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const parsed = createExamSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ message: "Validasi gagal", errors: parsed.error.flatten() });
      }

      const { classId } = request.params;
      const targetClass = await prisma.class.findUnique({
        where: { id: classId, teacherId: request.user!.id },
      });

      if (!targetClass) {
        return reply.status(404).send({ message: "Kelas tidak ditemukan" });
      }

      const startTime = parseISO(parsed.data.startTime);
      const endTime = parseISO(parsed.data.endTime);

      if (isAfter(startTime, endTime)) {
        return reply.status(400).send({ message: "Waktu mulai harus sebelum waktu selesai" });
      }

      const exam = await prisma.exam.create({
        data: {
          classId,
          title: parsed.data.title,
          description: parsed.data.description,
          startTime,
          endTime,
          durationLimit: parsed.data.durationLimit,
          isPublished: parsed.data.isPublished,
        },
      });

      return reply.status(201).send(exam);
    }
  );

  app.get<{ Params: { id: string } }>(
    "/api/exams/:id",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { id } = request.params;
      const exam = await prisma.exam.findUnique({
        where: { id },
        include: { class: { select: { teacherId: true, name: true } } },
      });

      if (!exam) {
        return reply.status(404).send({ message: "Ujian tidak ditemukan" });
      }

      if (exam.class.teacherId === request.user!.id) {
        const attempts = await prisma.examAttempt.findMany({
          where: { examId: id },
          include: { student: { select: { id: true, name: true, npm: true, email: true } } },
        });
        return reply.send({ ...exam, attempts });
      }

      const enrollment = await prisma.classEnrollment.findUnique({
        where: { classId_studentId: { classId: exam.classId, studentId: request.user!.id } },
      });
      if (!enrollment) {
        return reply.status(403).send({ message: "Anda bukan peserta kelas ini" });
      }

      const now = new Date();
      if (isBefore(now, exam.startTime)) {
        const { description, ...safeExam } = exam;
        return reply.send({ ...safeExam, message: "Ujian belum dimulai" });
      }

      const attempt = await prisma.examAttempt.findUnique({
        where: { examId_studentId: { examId: id, studentId: request.user!.id } },
      });

      return reply.send({ ...exam, attempt });
    }
  );

  // Endpoint untuk user (murid) memulai ujian (atau meneruskan yg sudah ada)
  app.post<{ Params: { id: string } }>(
    "/api/exams/:id/attempt",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { id } = request.params;
      const exam = await prisma.exam.findUnique({ where: { id }, include: { class: { select: { teacherId: true } } } });
      if (!exam) return reply.status(404).send({ message: "Ujian tidak ditemukan" });

      if (exam.class.teacherId === request.user!.id) {
        return reply.status(403).send({ message: "Anda tidak bisa mengerjakan ujian kelas Anda sendiri" });
      }

      const now = new Date();
      if (isBefore(now, exam.startTime)) {
        return reply.status(403).send({ message: "Waktu ujian belum tiba" });
      }
      if (isAfter(now, exam.endTime)) {
        return reply.status(403).send({ message: "Waktu ujian sudah berakhir" });
      }

      // Check enrollment
      const enrolled = await prisma.classEnrollment.findUnique({
          where: { classId_studentId: { classId: exam.classId, studentId: request.user!.id } }
      });
      if (!enrolled) return reply.status(403).send({ message: "Bukan peserta kelas" });

      let attempt = await prisma.examAttempt.findUnique({
        where: { examId_studentId: { examId: id, studentId: request.user!.id } },
      });

      if (!attempt) {
        attempt = await prisma.examAttempt.create({
          data: {
            examId: id,
            studentId: request.user!.id,
            startTime: now,
            status: "ONGOING",
          },
        });
      }

      return reply.send({ attempt, serverTime: now });
    }
  );

  // Periodically save draft/submit code
  app.post<{ Params: { id: string }; Body: { code: string; isSubmit: boolean } }>(
    "/api/exams/:id/submit",
    { preHandler: [requireAuth] },
    async (request, reply) => {
        const { id } = request.params;
        const exam = await prisma.exam.findUnique({ where: { id }, include: { class: { select: { teacherId: true } } } });
        if (!exam) return reply.status(404).send({ message: "Ujian tidak ada" });

        if (exam.class.teacherId === request.user!.id) {
          return reply.status(403).send({ message: "Anda tidak bisa mensubmit ujian kelas Anda sendiri" });
        }

        const attempt = await prisma.examAttempt.findUnique({
            where: { examId_studentId: { examId: id, studentId: request.user!.id } }
        });

        if (!attempt) return reply.status(404).send({ message: "Belum memulai percobaan ujian (Attempt)" });

        if (attempt.status === "SUBMITTED") {
            return reply.status(400).send({ message: "Jawaban sudah disubmit sebelumnya" });
        }

        const { code, isSubmit } = request.body;

        const updated = await prisma.examAttempt.update({
            where: { id: attempt.id },
            data: {
                code,
                status: isSubmit ? "SUBMITTED" : "ONGOING",
                submittedAt: isSubmit ? new Date() : undefined,
            }
        });

        return reply.send({ message: isSubmit ? "Berhasil disubmit!" : "Draft tersimpan", status: updated.status });
    }
  );

  // Tab switch warning counter
  app.post<{ Params: { id: string } }>(
    "/api/exams/:id/warning",
    { preHandler: [requireAuth] },
    async (request, reply) => {
        const { id } = request.params;
        const exam = await prisma.exam.findUnique({ where: { id }, include: { class: { select: { teacherId: true } } } });
        if (!exam) return reply.status(404).send();

        if (exam.class.teacherId === request.user!.id) {
          return reply.status(403).send();
        }

        const attempt = await prisma.examAttempt.findUnique({
            where: { examId_studentId: { examId: id, studentId: request.user!.id } }
        });

        if (!attempt || attempt.status === "SUBMITTED") {
            return reply.status(400).send();
        }

        await prisma.examAttempt.update({
            where: { id: attempt.id },
            data: { warningCount: { increment: 1 } }
        });

        return reply.send({ message: "Peringatan tercatat" });
    }
  );

  // Admin melihat detail attempt siswa
  app.get<{ Params: { id: string, studentId: string } }>(
    "/api/exams/:id/attempts/:studentId",
    { preHandler: [requireAuth] },
    async (request, reply) => {
       const { id, studentId } = request.params;
       const exam = await prisma.exam.findUnique({ where: { id }, include: { class: true }});
       if (!exam) return reply.status(404).send({ message: "Ujian tidak ada" });
       if (exam.class.teacherId !== request.user!.id) return reply.status(403).send({ message: "Bukan kelas Anda" });

       const attempt = await prisma.examAttempt.findUnique({
          where: { examId_studentId: { examId: id, studentId } },
         include: { student: { select: { id: true, name: true, npm: true, email: true } } }
       });

       return reply.send(attempt);
    }
  );

  app.post<{ Params: { id: string, studentId: string } }>(
    "/api/exams/:id/attempts/:studentId/grade",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { id, studentId } = request.params;
      const parsed = gradeAttemptSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({ message: "Validasi nilai gagal", errors: parsed.error.flatten() });
      }

      const exam = await prisma.exam.findUnique({ where: { id }, include: { class: true } });
      if (!exam) return reply.status(404).send({ message: "Ujian tidak ada" });
      if (exam.class.teacherId !== request.user!.id) return reply.status(403).send({ message: "Bukan kelas Anda" });

      const attempt = await prisma.examAttempt.findUnique({
        where: { examId_studentId: { examId: id, studentId } },
      });

      if (!attempt) {
        return reply.status(404).send({ message: "Attempt peserta tidak ditemukan" });
      }

      const updated = await prisma.examAttempt.update({
        where: { id: attempt.id },
        data: {
          score: parsed.data.score ?? null,
          comment: parsed.data.comment ?? null,
        },
      });

      return reply.send({ message: "Nilai berhasil disimpan", attempt: updated });
    }
  );

  app.delete<{ Params: { id: string } }>(
    "/api/exams/:id",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { id } = request.params;

      const exam = await prisma.exam.findUnique({
        where: { id },
        include: { class: true },
      });

      if (!exam) {
        return reply.status(404).send({ message: "Ujian tidak ditemukan" });
      }

      if (exam.class.teacherId !== request.user!.id) {
        return reply.status(403).send({ message: "Bukan pemilik kelas" });
      }

      await prisma.exam.delete({
        where: { id },
      });

      return reply.send({ message: "Ujian berhasil dihapus" });
    }
  );
};
