import createError from "http-errors";
import { verifyToken } from "../lib/tokens.js";

export function authMiddleware(req, res, next) {
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return next(createError(401, "Authentication required"));

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(createError(401, "Invalid or expired token"));
  }
}
