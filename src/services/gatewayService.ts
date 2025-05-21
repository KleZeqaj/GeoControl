import { Gateway as GatewayDTO } from "@dto/Gateway";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { isValidMAC, throwConflictIfFound } from "@utils"
import { BadRequestError } from "@models/errors/BadRequestError";

export async function createGatewayService(macAddress: string, name: string, description: string, network: NetworkDAO): Promise<GatewayDAO> {
    const gatewayRepo = new GatewayRepository();

    if(!isValidMAC(macAddress)){
        throw new BadRequestError("MAC Address should be at least of lenght 1");
    }

    await gatewayRepo.isMacAlreadyPresent(macAddress);

    return gatewayRepo.createGateway(macAddress, name, description, network);
}

export async function updateGatewayService(networkCode: string, gatewayMac: string, gateway: GatewayDTO): Promise<void> {
    const gatewayRepo = new GatewayRepository();
    const oldGateway = await gatewayRepo.getGatewayByMacAddress(networkCode, gatewayMac);

    if (gateway.macAddress === undefined) 
        gateway.macAddress = oldGateway.macAddress;
    else {
        if(!isValidMAC(gateway.macAddress)){
        throw new BadRequestError("MAC Address should be at least of lenght 1");
    }

    await gatewayRepo.isMacAlreadyPresent(gateway.macAddress);
    }
    if (gateway.name === undefined) gateway.name = oldGateway.name;
    if (gateway.description === undefined) gateway.description = oldGateway.description;

    await gatewayRepo.updateGateway(networkCode, gatewayMac, gateway.macAddress, gateway.name, gateway.description);
}