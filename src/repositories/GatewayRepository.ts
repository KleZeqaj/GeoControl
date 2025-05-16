import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { GatewayDAO } from "@dao/GatewayDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { NetworkDAO } from "@models/dao/NetworkDAO";

export class GatewayRepository {
  private repo: Repository<GatewayDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(GatewayDAO);
  }

  async isMacAlreadyPresent(macAddress: string): Promise<void> {
    throwConflictIfFound(
      await this.repo.find({ where: { macAddress } }),
      () => true,
      `Gateway with MAC address '${macAddress}' already exists`
    );
  }

  getAllGateways(networkCode: string): Promise<GatewayDAO[]> {
    return this.repo.find({
        where: {
            network: { code: networkCode}
        },
        relations: ['network', 'sensors']
    });
  }

  async getGatewayByMacAddress(networkCode: string, gatewayMac: string): Promise<GatewayDAO> {
    return findOrThrowNotFound(
      await this.repo.find({ 
        where: { 
            network: { code: networkCode }, 
            macAddress: gatewayMac 
        }, 
            relations: ['network', 'sensors'] }),
      () => true,
      `Gateway with MAC address '${gatewayMac}' not found`
    );
  }

  async createGateway(
    macAddress: string,
    name: string,
    description: string,
    network: NetworkDAO): Promise<GatewayDAO> {
      
    return this.repo.save({
        macAddress: macAddress,
        name: name,
        description: description,
        network: network
    });
  }

  async deleteGateway(networkCode: string, macAddress: string): Promise<void> {
    await this.repo.remove(await this.getGatewayByMacAddress(networkCode, macAddress));
  }

  async updateGateway(networkCode: string, oldMac: string, newMac: string, newName: string, newDescription: string) : Promise<void>{
    await this.repo.update({macAddress: oldMac}, {macAddress: newMac, name: newName, description: newDescription});
    return;
}
}