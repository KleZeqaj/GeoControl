import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";

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

  async getSensorByMacAddress(gatewayMac: string, sensorMac: string): Promise<SensorDAO> {
    return findOrThrowNotFound(
      await this.repo.find({ 
        where: { 
          gateway: { macAddress: gatewayMac },
          macAddress: sensorMac,
        }, 
            relations: ['gateway'] }),
      () => true,
      `Sensor with MAC address '${sensorMac}' not found`
    );
  }

  async createSensor(
    macAddress: string,
    name: string,
    description: string,
    variable: string,
    unit: string,
    gatewayMac: string
  ): Promise<SensorDAO> {
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

    return this.repo.save({
      macAddress: macAddress,
      name: name,
      description: description,
      variable: variable,
      unit: unit,
      gatewayMac: gatewayMac,
    });
  }

  async deleteSensor(
    gatewayMac: string, 
    sensorMac: string
  ): Promise<void> {
    const sensor = await this.getSensorByMacAddress(gatewayMac, sensorMac);
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
