import { db } from "../db.js";

export async function createCustomer({ full_name, email }) {
  try {
    const { rows } = await db.query(
      `INSERT INTO customers (full_name, email)
                        VALUES ($1, $2)
                        RETURNING id, full_name, email`,
      [full_name, email],
    );
    return rows[0];
  } catch (err) {
    if (err.code === "23505")
      throw new Error("Customer already exists", { cause: err });
    throw err;
  }
}
