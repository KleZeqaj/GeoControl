import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import {
    closeTestDataSource,
    initializeTestDataSource,
    TestDataSource
} from "@test/setup/test-datasource";

beforeAll(async () => {
  await initializeTestDataSource();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  await TestDataSource.getRepository(NetworkDAO).clear();
});

describe("NetworkRepository: SQLite in-memory ", () => {
    const repo = new NetworkRepository();

    it("create network", async () => {

        const network = await repo.createNewNetwork("NET01", "Test Network", "Test Description");
        expect(network).toMatchObject({
            code: "NET01",
            name: "Test Network",
            description: "Test Description"
        })

        const found = await repo.getNetworkByCode("NET01");
        expect(found.code).toBe("NET01");
    })


    it("create network: conflict", async () => {

        await repo.createNewNetwork("NET01", "Test Network", "Test Description");
        await expect(
            repo.createNewNetwork("NET01", "Another Network", "Another Description")
        ).rejects.toThrow(ConflictError);
    })

    it("collects all networks", async() => {
        await repo.createNewNetwork("NET01", "Test Network", "Test Description");
        await repo.createNewNetwork("NET02", "Another Network", "Another Description");

        const result = await repo.getAllNetworks();

        expect(result.length).toBe(2);
        expect(result[0].code).toBe("NET01");
        expect(result[1].code).toBe("NET02");
    })

    it("throws NotFoundError when network is not found", async () => {

        await expect(
            repo.getNetworkByCode("NET01")
        ).rejects.toThrow(NotFoundError);
    });

    it("deletes a gateway", async () => {

        await repo.createNewNetwork("NET01", "Test Network", "Test Description");
        await repo.deleteNetwork("NET01");

        await expect(
            repo.getNetworkByCode("NET01")
        ).rejects.toThrow(NotFoundError);
    });

    it("updates a network", async () => {
        await repo.createNewNetwork("NET01", "Test Network", "Test Description");

        await repo.updateNetwork("NET01", "NET02", "Updated Network", "Updated Description");

        // Verifica che la vecchia network non esista più
        await expect(repo.getNetworkByCode("NET01")).rejects.toThrow(NotFoundError);

        // Verifica che la nuova network aggiornata esista e abbia i dati giusti
        const updated = await repo.getNetworkByCode("NET02");
        expect(updated).toMatchObject({
            code: "NET02",
            name: "Updated Network",
            description: "Updated Description"
        });
    });

    it("create network throws if code is empty", async () => {
        await expect(
            repo.createNewNetwork("", "Test Network", "Test Description")
        ).rejects.toThrow();
    });

    it("delete network throws if code is empty", async () => {
        await expect(
            repo.deleteNetwork("")
        ).rejects.toThrow();
    });

    it("update network throws if code is empty", async () => {
        await expect(
            repo.updateNetwork("", "NET02", "Updated Network", "Updated Description")
        ).rejects.toThrow();
    });

    it("update network throws if new code already exists", async () => {
        await repo.createNewNetwork("NET01", "Test Network", "Test Description");
        await repo.createNewNetwork("NET02", "Another Network", "Another Description");

        await expect(
            repo.updateNetwork("NET01", "NET02", "Updated Network", "Updated Description")
        ).rejects.toThrow(ConflictError);
    });

})