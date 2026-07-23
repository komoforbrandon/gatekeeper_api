import { readFileSync } from "node:fs";
import { db } from "../src/db.js";

const schema = readFileSync(
  new URL("../db/schemas.sql", import.meta.url),
  "utf8",
);

const seed = readFileSync(new URL("../db/seed.sql", import.meta.url), "utf8");

await db.query(schema);
await db.query(seed);

console.log("✅ Database reset(dropped, recreated, and seeded).");

await db.end();