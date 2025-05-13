import { Measurements as MeasurementsDTO } from "@dto/Measurements";
import { Measurement as MeasurementDTO } from "@dto/Measurement";
import { Stats as StatsDTO } from "@dto/Stats";
import { MeasurementRepository } from "@repositories/MeasurementRepository";
import { mapMeasurementDAOToDTO } from "@services/mapperService";
import { computeStats , getOutliers, groupAndComputeMeasurements } from "@services/measurementService";
import { createMeasurementsDTO } from "@services/mapperService";

export async function storeMeasurements(
  networkCode: string, 
  gatewayMacAddress: string, 
  sensorMacAddress: string, 
  measurements: MeasurementDTO[]): Promise<void> {
  const measurementRepo = new MeasurementRepository();
  const dateValueMap = new Map<Date, number>();
  measurements.forEach((m) => {
  dateValueMap.set(m.createdAt, m.value);
  });
  await measurementRepo.storeMeasurements(networkCode, gatewayMacAddress, sensorMacAddress, dateValueMap);
}


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
    const existingMacs = await measurementRepo.getValidMacs(networkCode, sensorMacs);
    const groupedMeasurements = await groupAndComputeMeasurements(measurementDAOArray, existingMacs, sensorMacs, startDate, endDate);

  return groupedMeasurements;
}

export async function getAllStatsOfNetwork(
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
    const existingMacs = await measurementRepo.getValidMacs(networkCode, sensorMacs);
    const groupedMeasurements = await groupAndComputeMeasurements(measurementDAOArray, existingMacs, sensorMacs, startDate, endDate);


    const stats : MeasurementsDTO[] = [];
    for (const measurement of groupedMeasurements) {
      stats.push(createMeasurementsDTO(measurement.sensorMacAddress, measurement.stats, null));
    }

  return stats;
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
  const existingMacs = await measurementRepo.getValidMacs(networkCode, sensorMacs);
  const groupedMeasurements = await groupAndComputeMeasurements(measurementDAOArray, existingMacs, sensorMacs, startDate, endDate);


    const outliers : MeasurementsDTO[] = [];
    for (const measurement of groupedMeasurements) {
      outliers.push(createMeasurementsDTO(measurement.sensorMacAddress, measurement.stats, (await getOutliers(measurement)).measurements));
    }
  
  return outliers;
}


