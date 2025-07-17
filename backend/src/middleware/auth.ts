import { Request, Response, NextFunction } from "express";
import { verifyToken, JWTPayload } from "../lib/auth";
import { Role } from "@prisma/client";

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }

  req.user = payload;
  next();
};

export const requireRole = (roles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

export const requireAdmin = requireRole([Role.ADMIN]);
export const requireCentreChief = requireRole([Role.ADMIN, Role.CENTRE_CHIEF]);
export const requireBaseChief = requireRole([
  Role.ADMIN,
  Role.CENTRE_CHIEF,
  Role.BASE_CHIEF,
]);
export const requireOperator = requireRole([
  Role.ADMIN,
  Role.CENTRE_CHIEF,
  Role.BASE_CHIEF,
  Role.OPERATOR,
]);
