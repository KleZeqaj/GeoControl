import { CONFIG } from "@config";
import { authenticateUser } from "@middlewares/authMiddleware";
import { getAllMeasurementsOfSensor, 
  getAllStatsOfSensor, 
  getAllOutliersOfSensor,
  getAllMeasurementsOfNetwork,
  getAllStatsOfNetwork,
  getAllOutliersOfNetwork,
  storeMeasurements } from "@controllers/measurementController";
import { parseISODateParamToUTC, parseStringArrayParam} from "@utils";
import { UserType } from "@models/UserType";
import { Router } from "express";
import { BadRequestError } from "@models/errors/BadRequestError";
import { MeasurementFromJSON } from "@models/dto/Measurement";
import { start } from "repl";

const router = Router();

// Store a measurement for a sensor (Admin & Operator)
router.post(
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/measurements",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      const measurementArray = req.body.map((measurement) => MeasurementFromJSON(measurement));
      await storeMeasurements(
        req.params.networkCode,
         req.params.gatewayMac,
         req.params.sensorMac, 
         measurementArray);
      res.status(201).send();
    } catch (error) {
      next(error);
    }
  }
);

// Retrieve measurements for a specific sensor
router.get(
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/measurements",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const measurements = await getAllMeasurementsOfSensor(
        req.params.networkCode, 
        req.params.gatewayMac,
        req.params.sensorMac,
        startDate ? startDate.toString() : undefined, endDate ? endDate.toString() : undefined);
      res.status(200).json(measurements);
    }
    catch (error) {
      next(error);
    }
  }
);

// Retrieve statistics for a specific sensor
router.get(CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/stats", 
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
  try {
      const { startDate, endDate } = req.query;
      const stats = await getAllStatsOfSensor(
        req.params.networkCode, 
        req.params.gatewayMac,
        req.params.sensorMac,
        startDate ? startDate.toString() : undefined, endDate ? endDate.toString() : undefined);
      res.status(200).json(stats);
    }
    catch (error) {
      next(error);
    }
});

// Retrieve only outliers for a specific sensor
router.get(
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/outliers",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
     try {
      const { startDate, endDate } = req.query;
      const measurements = await getAllOutliersOfSensor(
        req.params.networkCode, 
        req.params.gatewayMac,
        req.params.sensorMac,
        startDate ? startDate.toString() : undefined, endDate ? endDate.toString() : undefined);
      res.status(200).json(measurements);
    }
    catch (error) {
      next(error);
    }
  }
);

// Retrieve measurements for a set of sensors of a specific network
router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/measurements",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const sensorMacs = parseStringArrayParam(req.query.sensorMacs);

      const measurements = await getAllMeasurementsOfNetwork(
        req.params.networkCode, 
        sensorMacs,
        startDate ? startDate.toString() : undefined, endDate ? endDate.toString() : undefined);
      res.status(200).json(measurements);
    }
    catch (error) {
      next(error);
    }
  }
);

// Retrieve statistics for a set of sensors of a specific network
router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/stats",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const sensorMacs = parseStringArrayParam(req.query.sensorMacs);

      const stats = await getAllStatsOfNetwork(
        req.params.networkCode, 
        sensorMacs,
        startDate ? startDate.toString() : undefined, endDate ? endDate.toString() : undefined);
      res.status(200).json(stats);
    }
    catch (error) {
      next(error);
    }
  }
);

// Retrieve only outliers for a set of sensors of a specific network
router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/outliers",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
    
      const sensorMacs = parseStringArrayParam(req.query.sensorMacs);

      const measurements = await getAllOutliersOfNetwork(
        req.params.networkCode, 
        sensorMacs,
        startDate ? startDate.toString() : undefined, endDate ? endDate.toString() : undefined);
      res.status(200).json(measurements);
    }
    catch (error) {
      next(error);
    }
  }
);

export default router;
