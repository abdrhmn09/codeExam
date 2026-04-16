import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../config.js";
const SALT_ROUNDS = 12;
export const hashPassword = async (password) => {
    return bcrypt.hash(password, SALT_ROUNDS);
};
export const comparePassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};
export const signSessionToken = (payload) => {
    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: "7d",
    });
};
export const verifySessionToken = (token) => {
    return jwt.verify(token, config.jwtSecret);
};
export function generateVerificationToken() {
    // Generate 32 byte random token, hasil hex string
    return crypto.randomBytes(32).toString("hex");
}
export function hashVerificationToken(token) {
    // Hash dengan SHA256, konsisten setiap kali dipanggil
    return crypto.createHash("sha256").update(token).digest("hex");
}
