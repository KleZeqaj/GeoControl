import { AppDataSource } from "@database";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import { LessThanOrEqual, MoreThanOrEqual, In, Between,  Repository } from "typeorm";
import { SensorDAO } from "@models/dao/SensorDAO";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { findOrThrowNotFound } from "@utils";
import { GatewayDAO } from "@models/dao/GatewayDAO";

export class MeasurementRepository {
    private repo: Repository<MeasurementDAO>;
    private sensorRepo: Repository<SensorDAO>;
    private gatewayRepo: Repository<GatewayDAO>;
    private networkRepo: Repository<NetworkDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(MeasurementDAO);
        this.sensorRepo = AppDataSource.getRepository(SensorDAO);
        this.gatewayRepo = AppDataSource.getRepository(GatewayDAO);
        this.networkRepo = AppDataSource.getRepository(NetworkDAO);

    }

  async getAllMeasurementsOfSensor(networkCode:string, 
    gatewayMacAddress: string, 
    sensorMacAddress: string, 
    startDate?: Date, endDate?: Date): Promise<MeasurementDAO[]> {

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
  const where: any = {
    sensor: { macAddress : sensorMacAddress },
  };

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(startDate);
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(endDate);
    }

  const measurements = await this.repo.find({
    where
  });

    return measurements;
  }

  async getAllMeasurementsOfNetwork(networkCode: string, sensorMacs?:string[],
     startDate?:Date, endDate?: Date): Promise<MeasurementDAO[]> {

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

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(startDate);
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(endDate);
    }

      return this.repo.find({
        where,
        relations: ["sensor", "sensor.gateway", "sensor.gateway.network"],
      });

  }

  async storeMeasurements(networkCode: string, 
    gatewayMacAddress: string, 
    sensorMacAddress: string, 
    valori: Map<Date,number>): Promise<MeasurementDAO[]> {

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

    // Costruisci le entità da salvare
  const measurements: MeasurementDAO[] = [];

  for (const [createdAt, value] of valori.entries()) {
    const m = new MeasurementDAO();
    m.createdAt = createdAt;
    m.value = value;
    m.sensorMacAddress = sensorMacAddress;
    measurements.push(m);
  }

  // Salvataggio batch
  return this.repo.save(measurements);

  }

  async getValidMacs(
    networkCode: string,
    sensorMacs?: string[]): Promise<string[]> {

    // Verifica se il network esiste, se non lo trova lancia un NotFoundError
    findOrThrowNotFound(
      await this.networkRepo.find({ where: { code : networkCode } }),
      () => true,
      `Network with code '${networkCode}' not found`
    )

    const where: any = {
      gateway : {
        network: {
          code: networkCode,
        },
      }
    };

        // Filtro solo se sensorMacs è definito e non vuoto
    if (sensorMacs && sensorMacs.length > 0) {
      where.macAddress = In(sensorMacs);
    }

    const sensors = await this.sensorRepo.find({
      where,
      relations: ["gateway", "gateway.network"],
    });

    const existingMacs = sensors.map((sensor) => sensor.macAddress);
    return existingMacs;
  }
}