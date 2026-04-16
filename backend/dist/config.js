import dotenv from "dotenv";
dotenv.config();
const required = ["JWT_SECRET"];
for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
}
export const config = {
    port: Number(process.env.PORT ?? 4000),
    frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
    jwtSecret: process.env.JWT_SECRET,
    cookieName: process.env.COOKIE_NAME ?? "oce_session",
    nodeEnv: process.env.NODE_ENV ?? "development",
};
export const isProduction = config.nodeEnv === "production";
