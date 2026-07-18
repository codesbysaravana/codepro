import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET: string = process.env.JWT_SECRET || "fallback_secret_for_development_only_123";

export interface AuthRequest extends Request {
  user?: {
    userId: number;
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Missing token value" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as { userId: number };
    req.user = decoded;
    next();
  } catch (error) {
    console.error("[AUTH] JWT Verification failed:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
};
