import { AppDataSource } from "@database";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { Repository } from "typeorm";

export class NetworkRepository {
    private repo: Repository<NetworkDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(NetworkDAO);
    }

    getAllNetworks() : Promise<NetworkDAO[]>{
        return this.repo.find();
    }

    async createNewNetwork(code: string, name: string, description : string = "") : Promise<NetworkDAO> {
        throwConflictIfFound(
            await this.repo.find({ where: { code } }),
            () => true,
            `Network with code '${code}' already exists`
        );

        return this.repo.save({
            code: code, 
            name: name, 
            description: description
        });
    }


    async getNetworkByCode(code: string): Promise<NetworkDAO>{
        return findOrThrowNotFound(
            await this.repo.find({ where: { code } }),
            () => true,
            `Network with code '${code}' not found`
        );
    }


    async updateNetwork(code: string, newName: string, newDescription: string) : Promise<void>{
        await this.getNetworkByCode(code);
        await this.repo.update(code, {name: newName, description: newDescription} );
        return;
    }

    async deleteNetwork(code: string) : Promise<void>{
        await this.repo.remove(await this.getNetworkByCode(code));
    }
}
