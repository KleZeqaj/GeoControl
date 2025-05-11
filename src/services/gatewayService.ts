import { Gateway as GatewayDTO } from "@dto/Gateway";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { getGateway } from "@controllers/gatewayController"

export async function updateGatewayService(networkCode: string, gatewayMac: string, gateway: GatewayDTO): Promise<void> {
    const gatewayRepo = new GatewayRepository();
    const oldGateway = await gatewayRepo.getGatewayByMacAddress(networkCode, gatewayMac);

    if (gateway.macAddress === undefined) gateway.macAddress = oldGateway.macAddress;
    if (gateway.name === undefined) gateway.name = oldGateway.name;
    if (gateway.description === undefined) gateway.description = oldGateway.description;

    await gatewayRepo.updateGateway(networkCode, gatewayMac, gateway.macAddress, gateway.name, gateway.description);
}