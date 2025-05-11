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


    getAllNetworks() : Promise<NetworkDAO[]>{
        return this.repo.find();
    }

    async createNewNetwork(code: string, name?: string, description?: string) : Promise<NetworkDAO> {

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

        return this.repo.save({
            code: code, 
            name: name, 
            description: description
        });
    }


    async getNetworkByCode(code: string): Promise<NetworkDAO>{

        if (code.length < 1){
            throw new Error("Code Length must be at least 1!");
        }
        if (!this.isAlphanumeric(code)){
            throw new Error("Provided Code must be alphanumeric!");   
        }

        return findOrThrowNotFound(
            await this.repo.find({ where: { code } }),
            () => true,
            `Network with code '${code}' not found`
        );
    }


    async updateNetwork(code: string, newCode?: string ,newName?: string, newDescription?: string) : Promise<void>{
        await this.getNetworkByCode(code);
        await this.repo.update(code, {code: newCode, name: newName, description: newDescription});
        return;
    }

    async deleteNetwork(code: string) : Promise<void>{
        await this.repo.remove(await this.getNetworkByCode(code));
    }
}
