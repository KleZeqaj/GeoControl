import { Measurements as MeasurementsDTO } from "@dto/Measurements";
import { Stats as StatsDTO } from "@dto/Stats";
import { MeasurementRepository } from "@repositories/MeasurementRepository";
import { mapMeasurementDAOToDTO } from "@services/mapperService";
import { computeStats , getOutliers, groupAndComputeMeasurements } from "@services/measurementService";

export async function getAllMeasurementsOfSensor(
  networkCode: string, 
  gatewayMacAddress: string,
  sensorMacAddress: string,
  startDate?: Date,
  endDate?: Date): Promise<MeasurementsDTO> {
  const measurementRepo = new MeasurementRepository();
  const measurementArray = (await measurementRepo.getAllMeasurementsOfSensor(networkCode, gatewayMacAddress, sensorMacAddress, startDate, endDate)).map(mapMeasurementDAOToDTO);
  const measurements = await computeStats(measurementArray, sensorMacAddress, startDate, endDate); 
  return measurements;
}

export async function getAllStatsOfSensor(
  networkCode: string, 
  gatewayMacAddress: string,
  sensorMacAddress: string,
  startDate?: Date,
  endDate?: Date): Promise<StatsDTO> {
  const measurementRepo = new MeasurementRepository();
  const measurementArray = (await measurementRepo.getAllMeasurementsOfSensor(networkCode, gatewayMacAddress, sensorMacAddress, startDate, endDate)).map(mapMeasurementDAOToDTO);
  const measurements = await computeStats(measurementArray, sensorMacAddress, startDate, endDate); 
  return measurements.stats;
}

export async function getAllOutliersOfSensor(
  networkCode: string, 
  gatewayMacAddress: string,
  sensorMacAddress: string,
  startDate?: Date,
  endDate?: Date): Promise<MeasurementsDTO> {
  const measurementRepo = new MeasurementRepository();
  const measurementArray = (await measurementRepo.getAllMeasurementsOfSensor(networkCode, gatewayMacAddress, sensorMacAddress, startDate, endDate)).map(mapMeasurementDAOToDTO);
  const measurements = await computeStats(measurementArray, sensorMacAddress, startDate, endDate);
  const outliers = await getOutliers(measurements); 
  return outliers;
}

export async function getAllMeasurementsOfNetwork( 
  networkCode: string, 
  sensorMacs?: string[],
  startDate?: Date,
  endDate?: Date): Promise<MeasurementsDTO[]> {
  const measurementRepo = new MeasurementRepository();
  const measurementDAOArray = await measurementRepo.getAllMeasurementsOfNetwork(
    networkCode,
    sensorMacs,
    startDate,
    endDate
  );
  const groupedMeasurements = await groupAndComputeMeasurements(measurementDAOArray, sensorMacs, startDate, endDate);

  return groupedMeasurements;
}

export async function getAllStatsOfNetwork(
  networkCode: string, 
  sensorMacs?: string[],
  startDate?: Date,
  endDate?: Date): Promise<StatsDTO[]> {
    const measurementRepo = new MeasurementRepository();
  const measurementDAOArray = await measurementRepo.getAllMeasurementsOfNetwork(
    networkCode,
    sensorMacs,
    startDate,
    endDate
  );

    const groupedMeasurements = await groupAndComputeMeasurements(measurementDAOArray, sensorMacs, startDate, endDate);

  return groupedMeasurements.map((measurement) => measurement.stats);
}

export async function getAllOutliersOfNetwork(
  networkCode: string, 
  sensorMacs?: string[],
  startDate?: Date,
  endDate?: Date): Promise<MeasurementsDTO[]> {
  const measurementRepo = new MeasurementRepository();
  const measurementDAOArray = await measurementRepo.getAllMeasurementsOfNetwork(
    networkCode,
    sensorMacs,
    startDate,
    endDate
  );
  const groupedMeasurements = await groupAndComputeMeasurements(measurementDAOArray, sensorMacs, startDate, endDate);

  const outliers = await Promise.all(
    groupedMeasurements.map((measurement) => getOutliers(measurement))
  );
  
  return outliers;
}


