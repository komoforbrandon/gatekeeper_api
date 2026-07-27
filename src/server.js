import { createServer } from "node:http";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { db } from "./db.js";
import { logger } from "./lib/logger.js";

const app = createApp();

const server = createServer(app);

server.listen(config.PORT, () => {
  logger.info(`Gatekeeper API listening on http://localhost:${config.PORT}`);
  logger.info(`Docs: http://localhost:${config.PORT}/docs`);
  logger.info(`Health: http://localhost:${config.PORT}/health`);
});

async function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully...`);
  server.close();
  await db.end();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
