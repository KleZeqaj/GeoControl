import { AppDataSource } from "@database";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { Repository } from "typeorm";


export class NetworkRepository {
    private repo: Repository<NetworkDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(NetworkDAO);
    }

    isAlphanumeric(str: string): boolean {
        const regex = /^[a-zA-Z0-9]*$/;
        return regex.test(str);
    }

    async checkOnNetID(code: string): Promise<void> {
        if (code.length < 1){
            throw new Error("Code Length must be at least 1!");
        }
        
        if (!this.isAlphanumeric(code)){
            throw new Error("Code must be alphanumeric!");
        }

        throwConflictIfFound(
            await this.repo.find({ where: { code } }),
            () => true,
            `Network with code '${code}' already exists`
        );
    }

    getAllNetworks() : Promise<NetworkDAO[]>{
        return this.repo.find({
            relations: ['gateways', 'gateways.sensors'],
        });
    }

    async createNewNetwork(code: string, name?: string, description?: string) : Promise<NetworkDAO> {

        await this.checkOnNetID(code);

        return this.repo.save({
            code: code, 
            name: name, 
            description: description
        });
    }


    async getNetworkByCode(code: string): Promise<NetworkDAO>{
        return findOrThrowNotFound(
            await this.repo.find({ 
                where: { code },
                relations: ["gateways", "gateways.sensors"],
            }),
            () => true,
            `Network with code '${code}' not found`
        );
    }


    async updateNetwork(code: string, newCode?: string ,newName?: string, newDescription?: string) : Promise<void>{
        const network = await this.getNetworkByCode(code);

        if (newCode === undefined)
            newCode = network.code;
        else {
            await this.checkOnNetID(newCode);
        }
        if (newName === undefined)
            newName = network.name;
        if (newDescription === undefined)
            newDescription = network.description;
        
        await this.repo.update({code}, {code: newCode, name: newName, description: newDescription});
        return;
    }

    async deleteNetwork(code: string) : Promise<void>{
        await this.repo.remove(await this.getNetworkByCode(code));
    }
}
