import { db } from "../db.js";

export async function create({ email, passwordHash }) {
  try {
    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash)
            VALUES ($1, $2)
            RETURNING id, email, created_at`,
      [email, passwordHash],
    );
    return rows[0];
  } catch (err) {
    if (err.code === "23505") throw new Error('duplicate',{cause: err});
    throw err;
  }
}

export async function findByEmail(email) {
  const { row } = await db.query(
    `SELECT id, email, password_hash, created_at FROM users WHERE email = $1`,
    [email],
  );
  return row[0] ?? null;
}
