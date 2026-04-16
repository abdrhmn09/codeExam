import { config } from "../config.js";
import { verifySessionToken } from "../lib/auth.js";
export const requireAuth = async (request, reply) => {
    const token = request.cookies[config.cookieName];
    if (!token) {
        return reply.status(401).send({ message: "Unauthorized" });
    }
    try {
        const payload = verifySessionToken(token);
        request.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        };
    }
    catch {
        return reply.status(401).send({ message: "Invalid or expired session" });
    }
};
export const requireRole = (role) => {
    return async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({ message: "Unauthorized" });
        }
        if (request.user.role !== role) {
            return reply.status(403).send({ message: "Forbidden" });
        }
    };
};
