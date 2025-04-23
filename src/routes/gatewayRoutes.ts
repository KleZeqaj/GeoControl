import AppError from "@models/errors/AppError";
import { Router } from "express";

const router = Router({ mergeParams: true });

// Get all gateways (Any authenticated user)
router.get("", (req, res, next) => {
  throw new AppError("Method not implemented", 500);
});

// Create a new gateway (Admin & Operator)
router.post("", (req, res, next) => {
  throw new AppError("Method not implemented", 500);
});

// Get a specific gateway (Any authenticated user)
router.get("/:gatewayMac", (req, res, next) => {
  throw new AppError("Method not implemented", 500);
});

// Update a gateway (Admin & Operator)
router.patch("/:gatewayMac", (req, res, next) => {
  throw new AppError("Method not implemented", 500);
});

// Delete a gateway (Admin & Operator)
router.delete("/:gatewayMac", (req, res, next) => {
  throw new AppError("Method not implemented", 500);
});

export default router;
