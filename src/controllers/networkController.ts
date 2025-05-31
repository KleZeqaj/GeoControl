import { Network as NetworkDTO } from "@dto/Network";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { mapNetworkDAOToDTO } from "@services/mapperService";


export async function getAllNetworks(): Promise<NetworkDTO[]> {
    const networkRepo = new NetworkRepository();
    return (await networkRepo.getAllNetworks()).map(mapNetworkDAOToDTO);
}

export async function getNetworkByCode(code: string): Promise<NetworkDTO> {
    const networkRepo = new NetworkRepository();
    return mapNetworkDAOToDTO(await networkRepo.getNetworkByCode(code));
}

export async function createNewNetwork(networkDTO: NetworkDTO): Promise<void> {
    const networkRepo = new NetworkRepository();
    await networkRepo.createNewNetwork(networkDTO.code, networkDTO.name, networkDTO.description);
}

export async function updateNetwork(code: string, networkDTO: NetworkDTO): Promise<void>{
    const networkRepo = new NetworkRepository();
    await networkRepo.updateNetwork(code ,networkDTO.code, networkDTO.name, networkDTO.description);
}

export async function deleteNetwork(code: string): Promise<void> {
    const networkRepo = new NetworkRepository();
    await networkRepo.deleteNetwork(code);
}
