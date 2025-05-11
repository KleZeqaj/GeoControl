import { AppDataSource } from "@database";
import { MeasurementsDAO } from "@models/dao/MeasurementsDAO";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import { StatsDAO } from "@models/dao/StatsDAO";
import { Repository } from "typeorm";
import { NotFoundError } from "@models/errors/NotFoundError";

export class MeasurementRepository {
    private repo: Repository<MeasurementsDAO>;
    private measurementRepo: Repository<MeasurementDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(MeasurementsDAO);
        this.measurementRepo = AppDataSource.getRepository(MeasurementDAO);
    }

    getAllMeasurements() : Promise<MeasurementsDAO[]>{
        return this.repo.find();
    }

  async getAllMeasurementsOfSensor(macAddress: string): Promise<MeasurementsDAO[]> {
    const measurements = await this.repo.find({
      where: { sensorMacAddress: macAddress },
    });

    if (!measurements.length) {
      throw new NotFoundError(`No measurements found for sensor with MAC '${macAddress}'`);
    }

    return measurements;
  }

  async getAllStatsOfSensor(macAddress: string): Promise<StatsDAO[]> {
    const measurements = await this.repo.find({
      where: { sensorMacAddress: macAddress },
      relations: ["stats"], // eager loading della relazione
    });

    if (!measurements.length) {
      throw new NotFoundError(`No measurements found for sensor with MAC '${macAddress}'`);
    }

    // Filtra solo quelli che hanno le stats associate
    const statsList = measurements
      .map((m) => m.stats)
      .filter((s): s is StatsDAO => s !== null && s !== undefined);

    if (!statsList.length) {
      throw new NotFoundError(`No stats found for sensor with MAC '${macAddress}'`);
    }

    return statsList;
  }

  async getAllOutliersOfASensor(macAddress: string): Promise<MeasurementDAO[]> {
    const allOutliers = await this.measurementRepo.find({
      where: { isOutlier: true },
      relations: ["measurements"], // per accedere a sensorMacAddress
    });

    return allOutliers.filter(
      (m) => m.measurements?.sensorMacAddress === macAddress
    );
  }
}