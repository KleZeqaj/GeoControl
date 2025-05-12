import { Measurement as MeasurementDTO } from "@models/dto/Measurement";
import { Measurements as MeasurementsDTO } from "@models/dto/Measurements";
import { createMeasurementsDTO , createStatsDTO} from "@services/mapperService";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import { mapMeasurementDAOToDTO } from "@services/mapperService";

export async function computeStats(measurementArray: MeasurementDTO[], sensorMac:string, startDate?: Date, endDate?: Date): Promise<MeasurementsDTO> {
  
    const mean = measurementArray.reduce((acc, measurement) => acc + measurement.value, 0) / measurementArray.length;
    const variance = measurementArray.reduce((acc, measurement) => acc + Math.pow(measurement.value - mean, 2), 0) / measurementArray.length;

    const upperTreshold = mean + 2 * Math.sqrt(variance);
    const lowerTreshold = mean - 2 * Math.sqrt(variance);

    const isOutlier = (value: number) => value > upperTreshold || value < lowerTreshold;

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
        upperTreshold,
        lowerTreshold
    );

    // Aggiorno i valori di isOutlier
      const updatedMeasurements: MeasurementDTO[] = measurementArray.map(m => ({
    ...m,
    isOutlier: isOutlier(m.value),
    }));

    return createMeasurementsDTO(sensorMac, stats, updatedMeasurements);

}

export async function getOutliers(measurements: MeasurementsDTO) : Promise<MeasurementsDTO> {
const outliers = measurements.measurements?.filter(m => m.isOutlier) || [];
measurements.measurements = outliers;

  return measurements;
}

export async function groupAndComputeMeasurements(
  measurementDAOArray: MeasurementDAO[],
  sensorMacs?: string[],
  startDate?: Date,
  endDate?: Date
): Promise<MeasurementsDTO[]> {
  const groupedBySensor = new Map<string, MeasurementDAO[]>();

  for (const measurement of measurementDAOArray) {
    const mac = measurement.sensor?.macAddress;
    if (!mac) continue;

    if (!groupedBySensor.has(mac)) {
      groupedBySensor.set(mac, []);
    }
    groupedBySensor.get(mac)!.push(measurement);
  }

  const selectedMacs = sensorMacs ?? Array.from(groupedBySensor.keys());
  const results: MeasurementsDTO[] = [];

  for (const mac of selectedMacs) {
    const daos = groupedBySensor.get(mac) ?? [];
    const dtos = daos.map(mapMeasurementDAOToDTO);
    const stats = await computeStats(dtos, mac, startDate, endDate);
    results.push(stats);
  }

  return results;
}




