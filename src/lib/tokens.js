import jwt from "jsonwebtoken";
import { config } from "../config.js";

const EXPIRES_IN = "7d";

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, config.JWT_SECRET, {
    expiresIn: EXPIRES_IN,
  });
}


export function verifyToken(token) {
  return jwt.verify(token, config.JWT_SECRET);
}