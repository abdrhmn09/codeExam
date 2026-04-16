import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { authRoutes } from "./routes/auth.js";
import { classRoutes } from "./routes/classes.js";
import { examRoutes } from "./routes/exams.js";
import { prisma } from "./lib/prisma.js";

const app = Fastify({
  logger: true,
});

await app.register(cookie);
await app.register(cors, {
  origin: config.frontendUrl,
  credentials: true,
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
});

app.get("/health", async () => ({ status: "ok" }));

await app.register(authRoutes);
await app.register(classRoutes);
await app.register(examRoutes);

const gracefulShutdown = async () => {
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

app
  .listen({ port: config.port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`Server running on port ${config.port}`);
  })
  .catch(async (error) => {
    app.log.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
