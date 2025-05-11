import {Measurements as MeasurementsDTO } from "@dto/Measurements";
import { MeasurementRepository } from "@repositories/MeasurementRepository";
import { mapMeasurementsDAOToDTO } from "@services/mapperService";

export async function getAllMeasurementsOfSensor(macAddress: string): Promise<MeasurementsDTO[]> {
  const measurementsRepo = new MeasurementRepository();
    return (await measurementsRepo.getAllMeasurementsOfSensor(macAddress)).map(mapMeasurementsDAOToDTO);
}


