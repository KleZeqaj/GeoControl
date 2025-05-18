import { Measurement, Measurement as MeasurementDTO } from "@models/dto/Measurement";
import { Measurements as MeasurementsDTO } from "@models/dto/Measurements";
import { createMeasurementsDTO , createStatsDTO} from "@services/mapperService";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import { mapMeasurementDAOToDTO } from "@services/mapperService";
import { BadRequestError } from "@models/errors/BadRequestError";

export async function computeStats(measurementArray: MeasurementDTO[], sensorMac:string, startDate?: Date, endDate?: Date): Promise<MeasurementsDTO> {
  
    const mean = measurementArray.reduce((acc, measurement) => acc + measurement.value, 0) / measurementArray.length;
    const variance = measurementArray.reduce((acc, measurement) => acc + Math.pow(measurement.value - mean, 2), 0) / measurementArray.length;

    const upperThreshold = mean + 2 * Math.sqrt(variance);
    const lowerThreshold = mean - 2 * Math.sqrt(variance);

    const isOutlier = (value: number) => value > upperThreshold || value < lowerThreshold;

    const dates = measurementArray.map(m => m.createdAt);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    const startDateTime = startDate ?? minDate;
    const endDateTime = endDate ?? maxDate;

    const stats = createStatsDTO(
        startDateTime,
        endDateTime,
        mean,
        variance,
        upperThreshold,
        lowerThreshold
    );

    // Aggiorno i valori di isOutlier
      const updatedMeasurements: MeasurementDTO[] = measurementArray.map(m => ({
    ...m,
    isOutlier: isOutlier(m.value),
    }));

    return createMeasurementsDTO(sensorMac, stats, updatedMeasurements);

}

export async function getOutliers(measurements: MeasurementsDTO) : Promise<MeasurementsDTO> {

  if (!measurements.measurements) {
    measurements.measurements = null;
  } else {
    const outliers = measurements.measurements?.filter(m => m.isOutlier) || [];
    measurements.measurements = outliers;
  }
  return measurements;
}

export async function groupAndComputeMeasurements(
  measurementDAOArray: MeasurementDAO[],
  existingMacs: string[],
  sensorMacs?: string[],
  startDate?: Date,
  endDate?: Date
): Promise<MeasurementsDTO[]> {
  const groupedBySensor = new Map<string, MeasurementDAO[]>();


  for (const measurement of measurementDAOArray) {
    const mac = measurement.sensor.macAddress;
    if (!groupedBySensor.has(mac)) {
      groupedBySensor.set(mac, []);
    }
    groupedBySensor.get(mac)!.push(measurement);
  }

  for (const mac of existingMacs) {
    if (!groupedBySensor.has(mac)) {
      groupedBySensor.set(mac, []);
    }
  }

  const selectedMacs = (sensorMacs ?? Array.from(groupedBySensor.keys()))
  .filter(mac => groupedBySensor.has(mac));
  const results: MeasurementsDTO[] = [];

  for (const mac of selectedMacs) {
    const daos = groupedBySensor.get(mac) ?? [];

    const dtos = daos.map(mapMeasurementDAOToDTO);
    if (dtos.length === 0) {
      // Il sensore esiste, ma non ha misurazioni
      results.push(createMeasurementsDTO(mac, null , []));
      continue;
    }
    const stats = await computeStats(dtos, mac, startDate, endDate);
    results.push(stats);
  }

  return results;
}

export async function checkMeasurementBodyPost(meas: any): Promise<void> {
  if(meas.createdAt === undefined && meas.value === undefined) {
    throw new BadRequestError("/body/createdAt' and '/body/value' must have required properties 'createdAt' and 'value'");
  }
  else if(meas.createdAt === undefined || meas.createdAt === null) {
    throw new BadRequestError("/body/createdAt' must have required property 'createdAt'");
  }
  else if(meas.value === undefined || meas.value === null) {
    throw new BadRequestError("/body/value' must have required property 'value''");
  }
}



