import * as gatewayController from "@controllers/gatewayController";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { SensorDAO } from "@models/dao/SensorDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import {
    closeTestDataSource,
    initializeTestDataSource,
    TestDataSource
} from "@test/setup/test-datasource";

describe("GatewayController Integration Tests (no mocks)", () => {
    const repoN = new NetworkRepository();
    const repoG = new GatewayRepository();
    const repoS = new SensorRepository();

    beforeAll(async () => {
        await initializeTestDataSource();
    });

    afterAll(async () => {
        await closeTestDataSource();
    });

    beforeEach(async () => {
        await TestDataSource.getRepository(NetworkDAO).clear();
        await TestDataSource.getRepository(GatewayDAO).clear();
        await TestDataSource.getRepository(SensorDAO).clear();
    });

    it("get gateway", async () => {
        const net = new NetworkDAO();
        net.code = "NET01";
        net.name = "ALP";
        net.description = "description";

        const resultNetwork = await repoN.createNewNetwork(net.code, net.name, net.description);
        expect(resultNetwork).toBeDefined();

        const getNet = await repoN.getNetworkByCode("NET01");
        expect(getNet?.name).toBe("ALP");
        expect(getNet?.code).toBe("NET01");

        const gatewayDTO1 = {
            macAddress: "AA:AA:AA:AA:AA:AA",
            name: "GW01",
            description: "DESC"
        };
        const gatewayDTO2 = {
            macAddress: "BB:BB:BB:BB:BB:BB",
            name: "GW02",
            description: "DESC DESC"
        };

        await gatewayController.createGateway("NET01", gatewayDTO1);
        await gatewayController.createGateway("NET01", gatewayDTO2);

        const gatewayList = await gatewayController.getAllGateways("NET01");
        expect(gatewayList.length).toBe(2);
    });

    it("get gateway", async () => {
        const net = new NetworkDAO();
        net.code = "NET01";
        net.name = "ALP";
        net.description = "description";

        const resultNetwork = await repoN.createNewNetwork(net.code, net.name, net.description);
        expect(resultNetwork).toBeDefined();

        const getNet = await repoN.getNetworkByCode("NET01");
        expect(getNet?.name).toBe("ALP");
        expect(getNet?.code).toBe("NET01");

        const gatewayDTO1 = {
            macAddress: "AA:AA:AA:AA:AA:AA",
            name: "GW01",
            description: "DESC"
        };
        const gatewayDTO2 = {
            macAddress: "BB:BB:BB:BB:BB:BB",
            name: "GW02",
            description: "DESC DESC"
        };

        await gatewayController.createGateway("NET01", gatewayDTO1);
        await gatewayController.createGateway("NET01", gatewayDTO2);
        const gatewayDAO = new GatewayDAO();
        gatewayDAO.macAddress = "BB:BB:BB:BB:BB:BB";
        gatewayDAO.name = "GW02";
        gatewayDAO.description = "DESC DESC";

        const sensor = await repoS.createSensor("71:B1:CE:01:C6:A9", gatewayDAO, "TH01", "External thermometer", "temperature", "C")

        const expectedDTO = {
            macAddress: "BB:BB:BB:BB:BB:BB",
            name: "GW02",
            description: "DESC DESC", 
            sensorsDTO: [sensor]
        };

        const getGate = await gatewayController.getGateway("NET01", "BB:BB:BB:BB:BB:BB");
        expect(getGate.macAddress).toBe("BB:BB:BB:BB:BB:BB");
        expect(getGate.sensors[0].macAddress).toBe("71:B1:CE:01:C6:A9");
        expect(getGate.sensors[0].name).toBe("TH01");
        expect(getGate.sensors[0].description).toBe("External thermometer");
       
        

    })

    it("createGateway successfull", async () => {
        const net = new NetworkDAO();
        net.code = "NET01";
        net.name = "ALP";
        net.description = "description";

        const resultNetwork = await repoN.createNewNetwork(net.code, net.name, net.description);
        expect(resultNetwork).toBeDefined();

        const gatewayDTO = {
        macAddress: "AA:AA:AA:AA:AA:AA",
        name: "GW01",
        description: "DESC"
        };

        await gatewayController.createGateway("NET01", gatewayDTO);

        const gatewayRepo = TestDataSource.getRepository(GatewayDAO);
        const createdGateway = await gatewayRepo.findOne({
        where: { macAddress: gatewayDTO.macAddress },
        relations: ["network"]
        });

        expect(createdGateway).toBeDefined();
        expect(createdGateway?.name).toBe(gatewayDTO.name);
        expect(createdGateway?.description).toBe(gatewayDTO.description);
        expect(createdGateway?.network.code).toBe(net.code);
    });


    it("createGateway failed due to duplicated macAddress", async () => {
        const net = new NetworkDAO();
        net.code = "NET01";
        net.name = "ALP";
        net.description = "description";

        const resultNetwork = await repoN.createNewNetwork(net.code, net.name, net.description);

        expect(resultNetwork).toBeDefined();

        const gatewayDTO = {
        macAddress: "AA:AA:AA:AA:AA:AA",
        name: "GW01",
        description: "DESC"
        };

        await gatewayController.createGateway("NET01", gatewayDTO);

        await expect(
            gatewayController.createGateway("NET01", gatewayDTO)
        ).rejects.toThrow(ConflictError);

    });

    it("update successfull", async() => {
        const net = new NetworkDAO();
        net.code = "NET01";
        net.name = "ALP";
        net.description = "description";

        const resultNetwork = await repoN.createNewNetwork(net.code, net.name, net.description);
        expect(resultNetwork).toBeDefined();

        const gatewayDTO = {
            macAddress: "AA:AA:AA:AA:AA:AA",
            name: "GW01",
            description: "DESC"
        };

        await gatewayController.createGateway("NET01", gatewayDTO);
        const getGateways = await repoG.getAllGateways("NET01");
        expect(getGateways.length).toBe(1)

        const updated_gateway = {
            macAddress: "AA:AA:AA:AA:AA:AA",
            name: undefined,
            description: "desc"
        }
        await gatewayController.updateGateway("NET01", "AA:AA:AA:AA:AA:AA", updated_gateway)

        const gatewayRepo = TestDataSource.getRepository(GatewayDAO);
        const createdGateway = await gatewayRepo.findOne({
            where: { macAddress: gatewayDTO.macAddress },
            relations: ["network"]
        });

        expect(createdGateway).toBeDefined();
        expect(createdGateway?.macAddress).toBe("AA:AA:AA:AA:AA:AA");
        expect(createdGateway?.name).toBe("GW01");
        expect(createdGateway?.description).toBe("desc");
        expect(createdGateway?.network.code).toBe("NET01");

    });

    it("update failed due to existing gateway with the macAddress", async() => {
        const net = new NetworkDAO();
        net.code = "NET01";
        net.name = "ALP";
        net.description = "description";

        const resultNetwork = await repoN.createNewNetwork(net.code, net.name, net.description);
        expect(resultNetwork).toBeDefined();

        const gatewayDTO1 = {
            macAddress: "AA:AA:AA:AA:AA:AA",
            name: "GW01",
            description: "DESC"
        };

        const gatewayDTO2 = {
            macAddress: "BB:BB:BB:BB:BB:BB",
            name: "GW02",
            description: "DESC DESC"
        }


        await gatewayController.createGateway("NET01", gatewayDTO1);
        await gatewayController.createGateway("NET01", gatewayDTO2);
        const getGateways = await repoG.getAllGateways("NET01");
        expect(getGateways.length).toBe(2)

        const updated_gateway = {
            macAddress: "BB:BB:BB:BB:BB:BB",
            name: undefined,
            description: "desc"
        }
        await expect(
            gatewayController.updateGateway("NET01", "AA:AA:AA:AA:AA:AA", updated_gateway)
        ).rejects.toThrow(ConflictError)

    
    });

    it("delete", async () => {
        const net = new NetworkDAO();
        net.code = "NET01";
        net.name = "ALP";
        net.description = "description";

        const resultNetwork = await repoN.createNewNetwork(net.code, net.name, net.description);
        expect(resultNetwork).toBeDefined();

        const gatewayDTO1 = {
            macAddress: "AA:AA:AA:AA:AA:AA",
            name: "GW01",
            description: "DESC"
        };

        const gatewayDTO2 = {
            macAddress: "BB:BB:BB:BB:BB:BB",
            name: "GW02",
            description: "DESC DESC"
        }

        await gatewayController.createGateway("NET01", gatewayDTO1);
        await gatewayController.createGateway("NET01", gatewayDTO2);
        await gatewayController.deleteGateway("NET01", "BB:BB:BB:BB:BB:BB");

        const allGateways = await repoG.getAllGateways("NET01");
        expect(allGateways.length).toBe(1)
        expect(allGateways[0]).toMatchObject({
            macAddress: "AA:AA:AA:AA:AA:AA",
            name: "GW01",
            description: "DESC"
        })

    });

});