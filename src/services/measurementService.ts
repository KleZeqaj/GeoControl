import { Measurement, Measurement as MeasurementDTO } from "@models/dto/Measurement";
import { Measurements as MeasurementsDTO } from "@models/dto/Measurements";
import { createMeasurementsDTO , createMeasurementDTO, createStatsDTO} from "@services/mapperService";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import { mapMeasurementDAOToDTO } from "@services/mapperService";
import { parseISODateParamToUTC } from "@utils";
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
        Number(mean.toFixed(2)),
        Number(variance.toFixed(2)),
        Number(upperThreshold.toFixed(2)),
        Number(lowerThreshold.toFixed(2)),
    );

    // Aggiorno i valori di isOutlier
    /*
    const updatedMeasurements: MeasurementDTO[] = measurementArray.map(m => ({
    value: Number(m.value.toFixed(2)),
    createdAt: m.createdAt,
    isOutlier: isOutlier(m.value),
    }));*/

    const updatedMeasurements: MeasurementDTO[] = [];
    for (const measurement of measurementArray) {
      updatedMeasurements.push(createMeasurementDTO(
        measurement.createdAt,
        measurement.value,
        isOutlier(measurement.value)))
    }

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

export function parseDate(
  dateString: string
): Date {
  const parsedDate = parseISODateParamToUTC(dateString);
  if (!parsedDate) {
    throw new BadRequestError(
      "Invalid date format. Expected ISO 8601 format (e.g., 2023-10-01T00:00:00Z)"
    );
  }
  return parsedDate;
}


