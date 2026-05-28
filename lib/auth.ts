import bcrypt from "bcryptjs";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const secret: Secret = JWT_SECRET;
export type AuthTokenPayload = {
  userId: string;
  role: "ADMIN" | "STAFF" | "EMPLOYEE";
};

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signAuthToken(payload: AuthTokenPayload) {
  const options: SignOptions = {
    expiresIn: "7d",
  };

  return jwt.sign(payload, secret, options);
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, secret) as AuthTokenPayload;
}