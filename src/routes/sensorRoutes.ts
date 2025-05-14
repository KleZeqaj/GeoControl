import { Router } from "express";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";
import { SensorFromJSON } from "@dto/Sensor"; 
import {
  getAllSensors,
  getSensor,
  createSensor,
  deleteSensor,
  updateSensor,
} from "@controllers/sensorController";

const router = Router({ mergeParams: true });

// Get all sensors (Any authenticated user)
router.get("", authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      res.status(200).json(
        await getAllSensors(req.params.networkCode, req.params.gatewayMac)
      );
    } catch (error) {
      next(error);
    }
  }
);

// Create a new sensor (Admin & Operator)
router.post(
  "",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      await createSensor(
        req.params.networkCode,
        req.params.gatewayMac,
        SensorFromJSON(req.body)
      );
      res.status(201).send("Sensor created");
    } catch (error) {
      next(error);
    }
  }
);

// Get a specific sensor (Any authenticated user)
router.get("/:sensorMac", authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      res.status(200).json(
        await getSensor(
          req.params.networkCode,
          req.params.gatewayMac,
          req.params.sensorMac
        )
      );
    } catch (error) {
      next(error);
    }
  }
);

// Update a sensor (Admin & Operator)
router.patch("/:sensorMac", authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      await updateSensor(
        req.params.networkCode,
        req.params.gatewayMac,
        req.params.sensorMac,
        SensorFromJSON(req.body)
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// Delete a sensor (Admin & Operator)
//ok
router.delete(
  "/:sensorMac",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      await deleteSensor(
        req.params.networkCode,
        req.params.gatewayMac,
        req.params.sensorMac
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
