import AppError from "@models/errors/AppError";
import { Router } from "express";

const router = Router();

// Get all networks (Any authenticated user)
router.get("", (req, res, next) => {
  throw new AppError("Method not implemented", 500);
});

// Create a new network (Admin & Operator)
router.post("", (req, res, next) => {
  throw new AppError("Method not implemented", 500);
});

// Get a specific network (Any authenticated user)
router.get("/:networkCode", (req, res, next) => {
  throw new AppError("Method not implemented", 500);
});

// Update a network (Admin & Operator)
router.patch("/:networkCode", (req, res, next) => {
  throw new AppError("Method not implemented", 500);
});

// Delete a network (Admin & Operator)
router.delete("/:networkCode", (req, res, next) => {
  throw new AppError("Method not implemented", 500);
});

export default router;
