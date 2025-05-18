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
  await TestDataSource.getRepository(GatewayDAO).clear();
  await TestDataSource.getRepository(NetworkDAO).clear();
});

describe("GatewayRepository: SQLite in-memory ", () => {
    const repoG = new GatewayRepository();
    const repoN = new NetworkRepository();

    const createTestNetwork = async () => {
    const network = new NetworkDAO();
    network.code = "NET01";
    network.name = "Test Network";
    return await TestDataSource.getRepository(NetworkDAO).save(network);
    };

    it("create gateway", async () => {
        const network = await createTestNetwork();

        const gateway = await repoG.createGateway("94:3F:BE:4C:4A:79", "GW01", "on-field aggregation node", network);
        expect(gateway).toMatchObject({
            macAddress: "94:3F:BE:4C:4A:79",
            name: "GW01",
            description: "on-field aggregation node",
            network
        })

        const found = await repoG.getGatewayByMacAddress("NET01","94:3F:BE:4C:4A:79");
        expect(found.macAddress).toBe("94:3F:BE:4C:4A:79");
    })


    it("create gateway: conflict", async () => {
        const network = await createTestNetwork();

        await repoG.createGateway("94:3F:BE:4C:4A:79", "GW01", "on-field aggregation node", network);
        await expect(
            repoG.isMacAlreadyPresent("94:3F:BE:4C:4A:79")
        ).rejects.toThrow(ConflictError);
    })

    it("collects all the gateways of a network", async() => {
        const network = await createTestNetwork();
        await repoG.createGateway("AA:BB:CC:DD:EE:FF", "GW01", "prova 1", network);
        await repoG.createGateway("DD:EE:FF:GG:HH:II", "GW02", "prova 2", network);

        const result = await repoG.getAllGateways("NET01");

        expect(result.length).toBe(2);
        expect(result[0]).toHaveProperty("macAddress");
    })

    it("throws NotFoundError when gateway is not found", async () => {
        const network = await createTestNetwork();

        await expect(
            repoG.getGatewayByMacAddress("NET01", "NO:PE:EX:IS:TS")
        ).rejects.toThrow(NotFoundError);
    });

    it("deletes a gateway", async () => {
        const network = await createTestNetwork();

        await repoG.createGateway("AA:BB:CC:DD:EE:FF", "Prova", "Prova cancellazione", network);
        await repoG.deleteGateway("NET01", "AA:BB:CC:DD:EE:FF");

        await expect(
            repoG.getGatewayByMacAddress("NET01", "AA:BB:CC:DD:EE:FF")
        ).rejects.toThrow(NotFoundError);
    })
})