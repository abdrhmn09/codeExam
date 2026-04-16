import { FastifyReply, FastifyRequest } from "fastify";
import { config } from "../config.js";
import { verifySessionToken } from "../lib/auth.js";

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  const token = request.cookies[config.cookieName];

  if (!token) {
    return reply.status(401).send({ message: "Unauthorized" });
  }

  try {
    const payload = verifySessionToken(token);
    request.user = {
      id: payload.sub,
      email: payload.email,
    };
  } catch {
    return reply.status(401).send({ message: "Invalid or expired session" });
  }
};
