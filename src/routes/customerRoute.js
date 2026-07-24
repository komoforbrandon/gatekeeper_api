import { Router } from "express";
import * as customer from "../models/customer.js";
import { parse } from "../lib/validate.js";
import { createCustomerSchema } from "../lib/schemas.js";

const router = Router();

// POST /customers
router.post("/", async (req, res, next) => {
  try {
    const { full_name, email } = parse(createCustomerSchema, req.body, 400);
    const createdCustomer = await customer.createCustomer({ full_name, email });

    res.status(201).json(createdCustomer);
  } catch (err) {
    if(err.message === "Customer already exists") {
      return res.status(409).json({ error: "Customer already exists" });
    }
    next(err);
  }
});

export default router;