
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { createGatewayService, updateGatewayService } from "@services/gatewayService";
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
  await TestDataSource.getRepository(GatewayDAO).clear();
});


describe("Gateway Service integration", () => {
    const GatewayRepo = new GatewayRepository();
    const NetworkRepo = new NetworkRepository();

    it("create gateway successfully", async () =>{
        const netDAO = new NetworkDAO();
        netDAO.code = "NET01";
        netDAO.description = "Descrizione rete1";
        netDAO.name = "Rete1";

        const net = await NetworkRepo.createNewNetwork(netDAO.code, netDAO.name, netDAO.description);
        expect(net).toMatchObject({
            code: netDAO.code,
            description: netDAO.description,
            name: netDAO.name
        });
        
        const gateway = await createGatewayService("AA:AA:AA:AA:AA:AA", "GW01", "DESC", net);
        expect(gateway).toMatchObject({
            macAddress: "AA:AA:AA:AA:AA:AA",
            name: "GW01",
            description: "DESC",
            network: net
        })

        await expect(
             createGatewayService("AA:AA:AA:AA:AA:AA", "GW01", "DESC", net)
        ).rejects.toThrow(ConflictError)

    })


    it("update", async () => {
        const netDAO = new NetworkDAO();
        netDAO.code = "NET01";
        netDAO.description = "Descrizione rete1";
        netDAO.name = "Rete1";

        const net = await NetworkRepo.createNewNetwork(netDAO.code, netDAO.name, netDAO.description);
        expect(net).toMatchObject({
            code: netDAO.code,
            description: netDAO.description,
            name: netDAO.name
        });
        
        const gateway = await createGatewayService("AA:AA:AA:AA:AA:AA", "GW01", "DESC", net);
        expect(gateway).toMatchObject({
            macAddress: "AA:AA:AA:AA:AA:AA",
            name: "GW01",
            description: "DESC",
            network: net
        })

        const gateway1 = await createGatewayService("BB:BB:BB:BB:BB:BB", "GW02", "DESC DESC", net)

        const oldGateway = await GatewayRepo.getGatewayByMacAddress(net.code, gateway1.macAddress);
        expect(oldGateway).toMatchObject({
            macAddress: "BB:BB:BB:BB:BB:BB",
            name: "GW02",
            description: "DESC DESC",
            network: net
        })

        gateway1.macAddress = undefined;
        gateway1.name = "GW100";
        gateway1.description = undefined;

        await updateGatewayService(net.code, oldGateway.macAddress, gateway1)

        const updatedGateway = await GatewayRepo.getGatewayByMacAddress(net.code, "BB:BB:BB:BB:BB:BB");
        expect(updatedGateway).toMatchObject({
            macAddress: "BB:BB:BB:BB:BB:BB",
            name: "GW100",
            description: "DESC DESC",
            network: net
        })  
    })

    it("update with undefined", async () =>{
        const netDAO = new NetworkDAO();
        netDAO.code = "NET01";
        netDAO.description = "Descrizione rete1";
        netDAO.name = "Rete1";

        const net = await NetworkRepo.createNewNetwork(netDAO.code, netDAO.name, netDAO.description);
        expect(net).toMatchObject({
            code: netDAO.code,
            description: netDAO.description,
            name: netDAO.name
        });
        
        const gateway = await createGatewayService("AA:AA:AA:AA:AA:AA", "GW01", "DESC", net);
        expect(gateway).toMatchObject({
            macAddress: "AA:AA:AA:AA:AA:AA",
            name: "GW01",
            description: "DESC",
            network: net
        })

        const update_to_be_performed = new GatewayDAO();
        update_to_be_performed.macAddress = undefined;
        update_to_be_performed.name = undefined;
        update_to_be_performed.description = "D";

        await updateGatewayService(net.code, "AA:AA:AA:AA:AA:AA", update_to_be_performed)
        const updatedGateway = await GatewayRepo.getGatewayByMacAddress(net.code, "AA:AA:AA:AA:AA:AA")
        expect(updatedGateway).toMatchObject({
            macAddress: "AA:AA:AA:AA:AA:AA",
            name: "GW01",
            description: "D",
            network: net
        })
    })

    it("update fails due to conflict error", async () =>{
        const netDAO = new NetworkDAO();
        netDAO.code = "NET01";
        netDAO.description = "Descrizione rete1";
        netDAO.name = "Rete1";

        const net = await NetworkRepo.createNewNetwork(netDAO.code, netDAO.name, netDAO.description);
        expect(net).toMatchObject({
            code: netDAO.code,
            description: netDAO.description,
            name: netDAO.name
        });
        
        const gateway1 = await createGatewayService("AA:AA:AA:AA:AA:AA", "GW01", "DESC", net);
        expect(gateway1).toMatchObject({
            macAddress: "AA:AA:AA:AA:AA:AA",
            name: "GW01",
            description: "DESC",
            network: net
        })

        const gateway2 = await createGatewayService("BB:BB:BB:BB:BB:BB", "GW02", "DESC DESC", net);
        expect(gateway2).toMatchObject({
            macAddress: "BB:BB:BB:BB:BB:BB",
            name: "GW02",
            description: "DESC DESC",
            network: net
        })

        const update_to_be_performed = new GatewayDAO();
        update_to_be_performed.macAddress = "BB:BB:BB:BB:BB:BB",
        update_to_be_performed.name = "name";
        update_to_be_performed.description = "DESC"


        await expect(
            updateGatewayService(netDAO.code, "AA:AA:AA:AA:AA:AA", update_to_be_performed)
        ).rejects.toThrow(ConflictError)
    })


})