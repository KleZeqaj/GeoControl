import { AppDataSource } from "@database";
import { MeasurementsDAO } from "@models/dao/MeasurementsDAO";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import { StatsDAO } from "@models/dao/StatsDAO";
import { LessThanOrEqual, MoreThanOrEqual, In, Repository } from "typeorm";
import { SensorDAO } from "@models/dao/SensorDAO";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { findOrThrowNotFound } from "@utils";
import { GatewayDAO } from "@models/dao/GatewayDAO";

export class MeasurementRepository {
    private repo: Repository<MeasurementsDAO>;
    private measurementRepo: Repository<MeasurementDAO>;
    private statsRepo: Repository<StatsDAO>;
    private sensorRepo: Repository<SensorDAO>;
    private gatewayRepo: Repository<GatewayDAO>;
    private networkRepo: Repository<NetworkDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(MeasurementsDAO);
        this.measurementRepo = AppDataSource.getRepository(MeasurementDAO);
        this.statsRepo = AppDataSource.getRepository(StatsDAO);
        this.sensorRepo = AppDataSource.getRepository(SensorDAO);
        this.gatewayRepo = AppDataSource.getRepository(GatewayDAO);
        this.networkRepo = AppDataSource.getRepository(NetworkDAO);

    }

    getAllMeasurements() : Promise<MeasurementsDAO[]>{
        return this.repo.find();
    }

  async getAllMeasurementsOfSensor(networkCode:string, 
    gatewayMacAddress: string, 
    sensorMacAddress: string, 
    startDate?: Date, endDate?: Date): Promise<MeasurementsDAO[]> {

    // Verifica se il network esiste, se non lo trova lancia un NotFoundError
    findOrThrowNotFound(
      await this.networkRepo.find({ where: { code : networkCode } }),
      () => true,
      `Network with code '${networkCode}' not found`
    )

    // Verifica se il gateway esiste, se non lo trova lancia un NotFoundError
    findOrThrowNotFound(
      await this.gatewayRepo.find({ where: { macAddress: gatewayMacAddress } }),
      () => true,
      `Gateway with MAC address '${gatewayMacAddress}' not found`
    )

    // Verifica se il sensore esiste, se non lo trova lancia un NotFoundError
    findOrThrowNotFound(
      await this.sensorRepo.find({ where: { macAddress: sensorMacAddress } }),
      () => true,
      `Sensor with MAC address '${sensorMacAddress}' not found`
    )
    
  // Costruzione del filtro per la query
  // Se startDate o endDate sono definiti, aggiungi il filtro per le stats
  const where: any = {
    sensorMacAddress,
  };

  if (startDate || endDate) {
    where.stats = {};

    if (startDate) {
      where.stats.startDate = MoreThanOrEqual(startDate);
    }

    if (endDate) {
      where.stats.endDate = LessThanOrEqual(endDate);
    }
  }

  // Query con relazioni e filtri su date se presenti
  const measurements = await this.repo.find({
    where,
    relations: ["measurement", "stats"],
  });

    return measurements;
  }

  async getAllStatsOfSensor(networkCode:string, 
    gatewayMacAddress: string, 
    sensorMacAddress: string, 
    startDate?: Date, endDate?: Date): Promise<StatsDAO[]> {

      // Verifica se il network esiste, se non lo trova lancia un NotFoundError
      findOrThrowNotFound(
        await this.networkRepo.find({ where: { code : networkCode } }),
        () => true,
        `Network with code '${networkCode}' not found`
      )

      // Verifica se il gateway esiste, se non lo trova lancia un NotFoundError
        findOrThrowNotFound(
        await this.gatewayRepo.find({ where: { macAddress: gatewayMacAddress } }),
        () => true,
        `Gateway with MAC address '${gatewayMacAddress}' not found`
      )

      // Verifica se il sensore esiste, se non lo trova lancia un NotFoundError
      findOrThrowNotFound(
        await this.sensorRepo.find({ where: { macAddress: sensorMacAddress } }),
        () => true,
        `Sensor with MAC address '${sensorMacAddress}' not found`
      )
    
      // Costruzione del filtro per la query
      // Se startDate o endDate sono definiti, aggiungi il filtro per le stats
      const where: any = {
        sensorMacAddress,
      };

      if (startDate || endDate) {
        where.stats = {};

        if (startDate) {
          where.stats.startDate = MoreThanOrEqual(startDate);
        }

        if (endDate) {
          where.stats.endDate = LessThanOrEqual(endDate);
        }
      }

    const measurements = await this.repo.find({
      where ,
      relations: ["stats"], 
    });

    // Filtra solo quelli che hanno le stats associate
    const statsList = measurements
      .map((m) => m.stats)
      .filter((s): s is StatsDAO => s !== null && s !== undefined);

    return statsList;
  }

  async getAllOutliersOfASensor(networkCode:string, 
    gatewayMacAddress: string, 
    sensorMacAddress: string, 
    startDate?: Date, endDate?: Date): Promise<MeasurementsDAO[]> {

     // Verifica se il network esiste, se non lo trova lancia un NotFoundError
    findOrThrowNotFound(
      await this.networkRepo.find({ where: { code : networkCode } }),
      () => true,
      `Network with code '${networkCode}' not found`
    )

    // Verifica se il gateway esiste, se non lo trova lancia un NotFoundError
    findOrThrowNotFound(
      await this.gatewayRepo.find({ where: { macAddress: gatewayMacAddress } }),
      () => true,
      `Gateway with MAC address '${gatewayMacAddress}' not found`
    )

    // Verifica se il sensore esiste, se non lo trova lancia un NotFoundError
    findOrThrowNotFound(
      await this.sensorRepo.find({ where: { macAddress: sensorMacAddress } }),
      () => true,
      `Sensor with MAC address '${sensorMacAddress}' not found`
    )
    
      // Costruzione del filtro per la query
      // Se startDate o endDate sono definiti, aggiungi il filtro per le stats
      const where: any = {
        sensorMacAddress,
      };

      if (startDate || endDate) {
        where.stats = {};

        if (startDate) {
          where.stats.startDate = MoreThanOrEqual(startDate);
        }

        if (endDate) {
          where.stats.endDate = LessThanOrEqual(endDate);
        }
      }

      where.isOutlier = true;
      // Query con relazioni e filtri su date se presenti
      const measurements = await this.repo.find({
        where,
        relations: ["measurement", "stats"],
      });

      return measurements;
  }

  async getAllMeasurementsOfNetwork(networkCode: string, sensorMacs?:string[],
     startDate?:Date, endDate?: Date): Promise<MeasurementsDAO[]> {

    // Verifica se il network esiste, se non lo trova lancia un NotFoundError
    findOrThrowNotFound(
      await this.networkRepo.find({ where: { code : networkCode } }),
      () => true,
      `Network with code '${networkCode}' not found`
    )

    // Costruzione del filtro
    const where: any = {  
      sensor: {
        gateway: {
          network: {
            code: networkCode,
          },
        },
      },
    };

    // Filtro solo se sensorMacs è definito e non vuoto
    if (sensorMacs && sensorMacs.length > 0) {
      where.sensor.macAddress = In(sensorMacs);
    }

    // Filtro per data
    if (startDate || endDate) {
      where.stats = {};
      if (startDate) {
        where.stats.startDate = MoreThanOrEqual(startDate);
      }
      if (endDate) {
        where.stats.endDate = LessThanOrEqual(endDate);
      }
    }

      return this.repo.find({
        where,
        relations: ["sensor", "sensor.gateway", "sensor.gateway.network", "stats", "measurement"],
      });

  }

async getAllStatsOfNetwork(networkCode: string, sensorMacs?:string[],
     startDate?:Date, endDate?: Date): Promise<StatsDAO[]> {
 findOrThrowNotFound(
    await this.networkRepo.find({ where: { code: networkCode } }),
    () => true,
    `Network with code '${networkCode}' not found`
  );

// Costruzione del filtro
    const where: any = {  
      sensor: {
        gateway: {
          network: {
            code: networkCode,
          },
        },
      },
    };

    // Filtro solo se sensorMacs è definito e non vuoto
    if (sensorMacs && sensorMacs.length > 0) {
      where.sensor.macAddress = In(sensorMacs);
    }

    // Filtro per data
    if (startDate || endDate) {
      where.stats = {};
      if (startDate) {
        where.stats.startDate = MoreThanOrEqual(startDate);
      }
      if (endDate) {
        where.stats.endDate = LessThanOrEqual(endDate);
      }
    }

  return this.statsRepo.find({
    where,
    relations: [
      "measurements",
      "measurements.sensor",
      "measurements.sensor.gateway",
      "measurements.sensor.gateway.network",
    ],
  });
}

async getAllOutliersOfNetwork(networkCode: string, sensorMacs?:string[],
     startDate?:Date, endDate?: Date): Promise<MeasurementsDAO[]> {
    // Verifica che il network esista
    findOrThrowNotFound(
      await this.networkRepo.find({ where: { code: networkCode } }),
      () => true,
      `Network with code '${networkCode}' not found`
    );

    // Costruzione del filtro
    const where: any = {
      isOutlier: true,
      sensor: {
        gateway: {
          network: {
            code: networkCode,
          },
        },
      },
    };

    // Filtro solo se sensorMacs è definito e non vuoto
    if (sensorMacs && sensorMacs.length > 0) {
      where.sensor.macAddress = In(sensorMacs);
    }

    // Filtro per data
    if (startDate || endDate) {
      where.stats = {};
      if (startDate) {
        where.stats.startDate = MoreThanOrEqual(startDate);
      }
      if (endDate) {
        where.stats.endDate = LessThanOrEqual(endDate);
      }
    }

    // Recupera le misurazioni
    return this.repo.find({
      where,
      relations: [
        "sensor",
        "sensor.gateway",
        "sensor.gateway.network",
        "stats",
        "measurement",
      ],
    });
  }
}