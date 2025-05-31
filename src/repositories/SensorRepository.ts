import { SensorDAO } from "@dao/SensorDAO";
import { AppDataSource } from "@database";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { Repository } from "typeorm";

export class SensorRepository {
  private repo: Repository<SensorDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(SensorDAO);
  }

  getAllSensors(gatewayMac: string): Promise<SensorDAO[]> {

    return this.repo.find({
      where: {
        gateway: { macAddress: gatewayMac },
      },
      relations: ["gateway"],
    });
  }

   async isMacAlreadyPresent(macAddress: string): Promise<void> {
    throwConflictIfFound(
      await this.repo.find({ where: { macAddress } }),
      () => true,
      `Sensor with MAC address '${macAddress}' already exists`
    );
  }

  async getSensorByMacAddress(sensorMac: string): Promise<SensorDAO> {

    return findOrThrowNotFound(
      await this.repo.find({ 
        where: { 
          macAddress: sensorMac,
        }, 
            relations: ['gateway'] }),
      () => true,
      `Sensor with MAC address '${sensorMac}' not found`
    );
  }

  async createSensor(
    macAddress: string,
    gateway: GatewayDAO,
    name?: string,
    description?: string,
    variable?: string,
    unit?: string,
  ): Promise<SensorDAO> {
    /*
    throwConflictIfFound(
      await this.repo.find({ where: { macAddress } }),
      () => true,
      `Sensor with MAC address '${macAddress}' already exists`
    );
/*
    const gatewayRepo = AppDataSource.getRepository(GatewayDAO);
  const gateway = await gatewayRepo.findOneOrFail({
    where: { macAddress: gatewayMac },
  });
  */

    await this.isMacAlreadyPresent(macAddress);

    return this.repo.save({
      macAddress: macAddress,
      gatewayMac: gateway.macAddress,
      name: name,
      description: description,
      variable: variable,
      unit: unit
    });
  }

  async deleteSensor(
    sensorMac: string
  ): Promise<void> {

    const sensor = await this.getSensorByMacAddress(sensorMac);
    await this.repo.remove(sensor);
  }

  async updateSensor(
    gatewayMac: string,
    oldMac: string,
    newMac: string,
    newName: string,
    newDescription: string,
    newVariable: string,
    newUnit: string
  ): Promise<void> {
    await this.repo.update({macAddress: oldMac}, {macAddress: newMac, name: newName, description: newDescription,  variable: newVariable, unit: newUnit});
    return;
  }
}
