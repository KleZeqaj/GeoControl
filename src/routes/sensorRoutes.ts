import AppError from "@models/errors/AppError";
import { Router } from "express";

const router = Router({ mergeParams: true });

// Get all sensors (Any authenticated user)
router.get("", (req, res, next) => {
  throw new AppError("Method not implemented", 500);
});

// Create a new sensor (Admin & Operator)
router.post("", (req, res, next) => {
  throw new AppError("Method not implemented", 500);
});

// Get a specific sensor (Any authenticated user)
router.get("/:sensorMac", (req, res, next) => {
  throw new AppError("Method not implemented", 500);
});

// Update a sensor (Admin & Operator)
router.patch("/:sensorMac", (req, res, next) => {
  throw new AppError("Method not implemented", 500);
});

// Delete a sensor (Admin & Operator)
router.delete("/:sensorMac", (req, res, next) => {
  throw new AppError("Method not implemented", 500);
});

export default router;
