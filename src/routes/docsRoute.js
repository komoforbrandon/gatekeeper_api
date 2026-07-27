import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const router = Router();

const jsonpath = fileURLToPath(new URL("../../docs/openapi.json", import.meta.url));

const spec = JSON.parse(readFileSync(jsonpath, "utf8"));

const swaggerHandler = swaggerUi.setup(spec);

router.use("/", swaggerUi.serve)
router.get("/", swaggerHandler);

export default router;