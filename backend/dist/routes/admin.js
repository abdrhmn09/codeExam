import { requireAuth, requireRole } from "../middlewares/auth.js";
export const adminRoutes = async (app) => {
    app.get("/api/admin/overview", { preHandler: [requireAuth, requireRole("admin")] }, async (request) => {
        return {
            message: "Admin access granted",
            user: request.user,
        };
    });
};
