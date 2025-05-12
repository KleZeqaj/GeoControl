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
import AppError from "@models/errors/AppError";
import { Router } from "express";
import { BadRequestError } from "@models/errors/BadRequestError";
import { MeasurementFromJSON } from "@models/dto/Measurement";

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
      // Converte da stringa ISO a oggetto Date, solo se presenti
      const parsedStartDate = parseISODateParamToUTC(startDate);
      const parsedEndDate = parseISODateParamToUTC(endDate);

      // Se sono presenti, controllo che siano validi, restuisco errore 400 se non lo sono
      if ((startDate && !parsedStartDate) || (endDate && !parsedEndDate)) {
        throw new BadRequestError(
          "Invalid date format. Expected ISO 8601 format (e.g., 2023-10-01T00:00:00Z)"
        )
      }
      const measurements = await getAllMeasurementsOfSensor(
        req.params.networkCode, 
        req.params.gatewayMac,
        req.params.sensorMac,
        parsedStartDate, parsedEndDate);
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
      // Converte da stringa ISO a oggetto Date, solo se presenti
      const parsedStartDate = parseISODateParamToUTC(startDate);
      const parsedEndDate = parseISODateParamToUTC(endDate);

      // Se sono presenti, controllo che siano validi, restuisco errore 400 se non lo sono
      if ((startDate && !parsedStartDate) || (endDate && !parsedEndDate)) {
        throw new BadRequestError(
          "Invalid date format. Expected ISO 8601 format (e.g., 2023-10-01T00:00:00Z)"
        )
      }
      const stats = await getAllStatsOfSensor(
        req.params.networkCode, 
        req.params.gatewayMac,
        req.params.sensorMac,
        parsedStartDate, parsedEndDate);
      res.status(200).json(stats);
    }
    catch (error) {
      next(error);
    }
});

// Retrieve only outliers for a specific sensor
router.get(
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/outliers",
  async (req, res, next) => {
     try {
      const { startDate, endDate } = req.query;
      // Converte da stringa ISO a oggetto Date, solo se presenti
      const parsedStartDate = parseISODateParamToUTC(startDate);
      const parsedEndDate = parseISODateParamToUTC(endDate);

      // Se sono presenti, controllo che siano validi, restuisco errore 400 se non lo sono
      if ((startDate && !parsedStartDate) || (endDate && !parsedEndDate)) {
        throw new BadRequestError(
          "Invalid date format. Expected ISO 8601 format (e.g., 2023-10-01T00:00:00Z)"
        )
      }
      const measurements = await getAllOutliersOfSensor(
        req.params.networkCode, 
        req.params.gatewayMac,
        req.params.sensorMac,
        parsedStartDate, parsedEndDate);
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
  async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      // Converte da stringa ISO a oggetto Date, solo se presenti
      const parsedStartDate = parseISODateParamToUTC(startDate);
      const parsedEndDate = parseISODateParamToUTC(endDate);

      // Se sono presenti, controllo che siano validi, restuisco errore 400 se non lo sono
      if ((startDate && !parsedStartDate) || (endDate && !parsedEndDate)) {
        throw new BadRequestError(
          "Invalid date format. Expected ISO 8601 format (e.g., 2023-10-01T00:00:00Z)"
        )
      }

      const sensorMacs = parseStringArrayParam(req.query.sensorMacs);

      const measurements = await getAllMeasurementsOfNetwork(
        req.params.networkCode, 
        sensorMacs,
        parsedStartDate, parsedEndDate);
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
  async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      // Converte da stringa ISO a oggetto Date, solo se presenti
      const parsedStartDate = parseISODateParamToUTC(startDate);
      const parsedEndDate = parseISODateParamToUTC(endDate);

      // Se sono presenti, controllo che siano validi, restuisco errore 400 se non lo sono
      if ((startDate && !parsedStartDate) || (endDate && !parsedEndDate)) {
        throw new BadRequestError(
          "Invalid date format. Expected ISO 8601 format (e.g., 2023-10-01T00:00:00Z)"
        )
      }

      const sensorMacs = parseStringArrayParam(req.query.sensorMacs);

      const stats = await getAllStatsOfNetwork(
        req.params.networkCode, 
        sensorMacs,
        parsedStartDate, parsedEndDate);
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
  async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      // Converte da stringa ISO a oggetto Date, solo se presenti
      const parsedStartDate = parseISODateParamToUTC(startDate);
      const parsedEndDate = parseISODateParamToUTC(endDate);

      // Se sono presenti, controllo che siano validi, restuisco errore 400 se non lo sono
      if ((startDate && !parsedStartDate) || (endDate && !parsedEndDate)) {
        throw new BadRequestError(
          "Invalid date format. Expected ISO 8601 format (e.g., 2023-10-01T00:00:00Z)"
        )
      }

      const sensorMacs = parseStringArrayParam(req.query.sensorMacs);

      const measurements = await getAllOutliersOfNetwork(
        req.params.networkCode, 
        sensorMacs,
        parsedStartDate, parsedEndDate);
      res.status(200).json(measurements);
    }
    catch (error) {
      next(error);
    }
  }
);

export default router;
