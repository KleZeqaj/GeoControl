import { Gateway as GatewayDTO } from "@dto/Gateway";
import { createGatewayService } from "@services/gatewayService";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository"
import { mapGatewayDAOToDTO } from "@services/mapperService";
import { updateGatewayService } from "@services/gatewayService"

export async function getAllGateways(networkCode: string): Promise<GatewayDTO[]> {
  const networkRepo = new NetworkRepository();
  const gatewayRepo = new GatewayRepository();
  await networkRepo.getNetworkByCode(networkCode);
  return (await gatewayRepo.getAllGateways(networkCode)).map(mapGatewayDAOToDTO);
}

export async function getGateway(networkCode: string, gatewayMac: string): Promise<GatewayDTO> {
  const networkRepo = new NetworkRepository();
  const gatewayRepo = new GatewayRepository();
  await networkRepo.getNetworkByCode(networkCode);
  return mapGatewayDAOToDTO(await gatewayRepo.getGatewayByMacAddress(networkCode, gatewayMac));
}

export async function createGateway(networkCode: string, gatewayDto: GatewayDTO): Promise<void> {
  const networkRepo = new NetworkRepository();
  await createGatewayService(gatewayDto.macAddress, gatewayDto.name, gatewayDto.description, await networkRepo.getNetworkByCode(networkCode));
}

export async function deleteGateway(networkCode: string, gatewayMac: string): Promise<void> {
  const networkRepo = new NetworkRepository();
  const gatewayRepo = new GatewayRepository();
  await networkRepo.getNetworkByCode(networkCode);
  await gatewayRepo.deleteGateway(networkCode, gatewayMac);
}

export async function updateGateway(networkCode: string, gatewayMac: string, gateway: GatewayDTO): Promise<void> {
    const networkRepo = new NetworkRepository();
    await networkRepo.getNetworkByCode(networkCode);
    await updateGatewayService(networkCode, gatewayMac, gateway);
  }
