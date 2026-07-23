import express from "express";
import helmet from "helmet";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import pinoHttp from "pino-http";
import createError from "http-errors";
import authRoute from "./routes/authRoute.js";
import eventRoute from "./routes/eventRoute.js";
// import { mountDocs } from './routes/docsRoute.js'
import { logger } from "./lib/logger.js";
import { config } from "./config.js";

export function createApp() {
  const app = express();

  if (config.NODE_ENV === "production") app.set("trust proxy", 1);

  app.use(helmet({ contentSecurityPolicy: false }));

  app.use(cors({ origin: config.CORS_ORIGIN }));

  app.use(pinoHttp({ logger }));

  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });
  // mountDocs(app)

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: config.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use("/auth", authRoute);
  app.use("/events", eventRoute);
  app.use((req, res, next) => {
    next(createError(404, "Route not found"));
  });

  app.use((err, req, res) => {
    const status = err.status || 500;
    if (status >= 500) {
      (req.log ?? logger).error({ err }, "request  failed");
    }
    res.status(status).json({
      error: {
        status,
        message: err.expose ? err.message : "Internal Server Error",
        detail: err.detail,
      },
    });
  });

  return app;
}

export { config };