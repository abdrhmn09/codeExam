import dotenv from "dotenv";

dotenv.config();

// Use SUPABASE_JWT_SECRET if available, otherwise fall back to JWT_SECRET
const jwtSecret = process.env.SUPABASE_JWT_SECRET ?? process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error(`Missing required environment variable: JWT_SECRET or SUPABASE_JWT_SECRET`);
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  jwtSecret: jwtSecret,
  cookieName: process.env.COOKIE_NAME ?? "oce_session",
  nodeEnv: process.env.NODE_ENV ?? "development",
  // Supabase config
  supabaseUrl: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

export const isProduction = config.nodeEnv === "production";
