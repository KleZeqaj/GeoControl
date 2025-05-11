import { Measurements as MeasurementsDTO } from "@dto/Measurements";
import { Stats as StatsDTO } from "@dto/Stats";
import { MeasurementRepository } from "@repositories/MeasurementRepository";
import { mapMeasurementsDAOToDTO, mapStatsDAOToDTO } from "@services/mapperService";

export async function getAllMeasurementsOfSensor(
  networkCode: string, 
  gatewayMacAddress: string,
  sensorMacAddress: string,
  startDate?: Date,
  endDate?: Date): Promise<MeasurementsDTO[]> {
  const measurementsRepo = new MeasurementRepository();
    return (await measurementsRepo.getAllMeasurementsOfSensor(networkCode, gatewayMacAddress, sensorMacAddress, startDate, endDate)).map(mapMeasurementsDAOToDTO);
}

export async function getAllStatsOfSensor(
  networkCode: string, 
  gatewayMacAddress: string,
  sensorMacAddress: string,
  startDate?: Date,
  endDate?: Date): Promise<StatsDTO[]> {
  const measurementsRepo = new MeasurementRepository();
    return (await measurementsRepo.getAllStatsOfSensor(networkCode, gatewayMacAddress, sensorMacAddress, startDate, endDate)).map(mapStatsDAOToDTO);
}

export async function getAllOutliersOfASensor(
  networkCode: string, 
  gatewayMacAddress: string,
  sensorMacAddress: string,
  startDate?: Date,
  endDate?: Date): Promise<MeasurementsDTO[]> {
  const measurementsRepo = new MeasurementRepository();
    return (await measurementsRepo.getAllOutliersOfASensor(networkCode, gatewayMacAddress, sensorMacAddress, startDate, endDate)).map(mapMeasurementsDAOToDTO);
}

export async function getAllMeasurementsOfNetwork( 
  networkCode: string, 
  sensorMacs?: string[],
  startDate?: Date,
  endDate?: Date): Promise<MeasurementsDTO[]> {
  const measurementsRepo = new MeasurementRepository();
    return (await measurementsRepo.getAllMeasurementsOfNetwork(networkCode, sensorMacs, startDate, endDate)).map(mapMeasurementsDAOToDTO);
}

export async function getAllStatsOfNetwork(
  networkCode: string, 
  sensorMacs?: string[],
  startDate?: Date,
  endDate?: Date): Promise<StatsDTO[]> {
  const measurementsRepo = new MeasurementRepository();
    return (await measurementsRepo.getAllStatsOfNetwork(networkCode, sensorMacs, startDate, endDate)).map(mapStatsDAOToDTO);
}

export async function getAllOutliersOfNetwork(
  networkCode: string, 
  sensorMacs?: string[],
  startDate?: Date,
  endDate?: Date): Promise<MeasurementsDTO[]> {
  const measurementsRepo = new MeasurementRepository();
    return (await measurementsRepo.getAllOutliersOfNetwork(networkCode, sensorMacs, startDate, endDate)).map(mapMeasurementsDAOToDTO);
}


