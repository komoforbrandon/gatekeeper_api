import { Router } from "express";
import createError from "http-errors";
import * as users from "../models/users.js";
import { parse } from "../lib/validate.js";
import { userSchema } from "../lib/schemas.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { signToken } from "../lib/tokens.js";

const router = Router();

const dummy_hash = hashPassword("not-a-real-password");

router.post("/register", async (req, res) => {
  const { email, password } = parse(userSchema, req.body, 422);
  try {
    const user = await users.create({
      email,
      passwordHash: hashPassword(password),
    });
    res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    if (err.message === "duplicate") {
      throw createError(409, "That email already exists");
    }
    throw err;
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = parse(userSchema, req.body, 422);

  const user = await users.findByEmail(email);

  const passwordCheck = verifyPassword(
    password,
    user ? user.password_hash : dummy_hash,
  );

  if (!user || !passwordCheck) {
    throw createError(401, "Invalid email or password");
  }

  res.json({
    token: signToken(user),
    user: { id: user.id, email: user.email },
  });
});

export default router;