import { readFileSync } from "node:fs";
import { db } from "../src/db.js";

const schema = readFileSync(
  new URL("../db/schemas.sql", import.meta.url),
  "utf8",
);

await db.query(schema);

console.log("✅ Migration complete (tables are ready).");

await db.end();
