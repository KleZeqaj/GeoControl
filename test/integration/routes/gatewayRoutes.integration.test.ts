import { app } from "@app";
import * as gatewayController from "@controllers/gatewayController";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { SensorDAO } from "@models/dao/SensorDAO";
import { Gateway as GatewayDTO } from "@models/dto/Gateway";
import { Sensor as SensorDTO } from "@models/dto/Sensor";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import * as authService from "@services/authService";
import {
    closeTestDataSource,
    initializeTestDataSource,
    TestDataSource
} from "@test/setup/test-datasource";
import request from "supertest";




describe("GatewayRoutes integration", () =>{
    const token = "Bearer faketoken";
    const gatewayRepo = new GatewayRepository();
    const networkRepo = new NetworkRepository();
    const sensorRepo = new SensorRepository();

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
        jest.clearAllMocks()
    })

    it("get a specific gateway", async () =>{
        const mockedSensor: SensorDTO = {
        macAddress: "00:11:22:33:44:66",
        name: "TH01",
        description: "External thermometer",
        variable: "temperature",
        unit: "C",
        };

        const mockedGateway: GatewayDTO = {
        macAddress: "AA:AA:AA:AA:AA:AA",
        name: "GW01",
        description: "DESC",
        sensors: [mockedSensor],
        };

        const authorizeSpy = jest.spyOn(authService, 'processToken').mockResolvedValue(undefined);

        const getGatewaySpy = jest
        .spyOn(gatewayController, 'getGateway')
        .mockResolvedValue(mockedGateway);

        const response = await request(app)
        .get("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA")
        .set("Authorization", token);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject(mockedGateway);
        expect(getGatewaySpy).toHaveBeenCalledWith("NET01", "AA:AA:AA:AA:AA:AA");

        getGatewaySpy.mockRestore();
        authorizeSpy.mockRestore();
    })

    it("get a specific gateway: 401 UnauthorizedError", async () => {
        const authorizeSpy = jest.spyOn(authService, 'processToken').mockImplementation(() => {
            throw new UnauthorizedError("Unauthorized: No token provided");
        });

        const response = await request(app)
        .get("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA")
        .set("Authorization", token);
        
        expect(response.status).toBe(401);
        expect(response.body.message).toMatch("Unauthorized: No token provided");
        authorizeSpy.mockRestore();
    });

    it("get a specific gateway: 404 NotFoundError", async () => {
        const network = await networkRepo.createNewNetwork("NET01", "ALP", "DESC");
        expect(network).toMatchObject({
            code : "NET01",
            name : "ALP",
            description : "DESC"
        })

        const gateway = await gatewayRepo.createGateway("AA:AA:AA:AA:AA:AA", "GW01", "DESC DESC", network);
        expect(gateway).toMatchObject({
            macAddress : "AA:AA:AA:AA:AA:AA",
            name : "GW01",
            description : "DESC DESC",
            network
        })

        const authorizeSpy = jest.spyOn(authService, 'processToken').mockResolvedValue(undefined);

        const response = await request(app)
        .get("/api/v1/networks/NET01/gateways/BB:BB:BB:BB:BB:BB")
        .set("Authorization", token);

        expect(response.status).toBe(404)
        expect(response.body.message).toMatch("Gateway with MAC address 'BB:BB:BB:BB:BB:BB' not found")
        

        const response2 = await request(app)
        .get("/api/v1/networks/NET02/gateways/AA:AA:AA:AA:AA:AA")
        .set("Authorization", token);

        expect(response2.status).toBe(404)
        expect(response2.body.message).toMatch("Network with code 'NET02' not found")
        authorizeSpy.mockRestore();
    })

    it("get a specific gateway : 500 Error", async () => {
        const authorizeSpy = jest.spyOn(authService, 'processToken').mockResolvedValue(undefined);
        const fakeError = new Error("InternalServerError");
        const getGatewayMock = jest.spyOn(gatewayController, 'getGateway').mockRejectedValue(fakeError);

        const response = await request(app)
        .get("/api/v1/networks/NET01/gateways/BB:BB:BB:BB:BB:BB")
        .set("Authorization", token);

        expect(response.status).toBe(500)  
        expect(response.body.message).toMatch(/InternalServerError/)
        
        authorizeSpy.mockRestore();
        getGatewayMock.mockRestore();
    })


    it("get all gateways of a network: 200 OK", async () => {
        const network = await networkRepo.createNewNetwork("NET01", "ALP", "DESC");
        expect(network).toMatchObject({
            code : "NET01",
            name : "ALP",
            description : "DESC"
        })

        const gateway = await gatewayRepo.createGateway("AA:AA:AA:AA:AA:AA", "GW01", "DESC DESC", network);
        expect(gateway).toMatchObject({
            macAddress : "AA:AA:AA:AA:AA:AA",
            name : "GW01",
            description : "DESC DESC",
            network
        })

        await gatewayRepo.createGateway("BB:BB:BB:BB:BB:BB", "GW02", "PROVA", network);
        
        const authorizeSpy = jest.spyOn(authService, 'processToken').mockResolvedValue(undefined);

        const response = await request(app)
        .get("/api/v1/networks/NET01/gateways")
        .set("Authorization", token); 
        
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(2);

        authorizeSpy.mockRestore();
    })

    it("get all gateways of a specific network : 401 UnauthorizedError", async () => {
        const authorizeSpy = jest.spyOn(authService, 'processToken').mockImplementation(() => {
            throw new UnauthorizedError("Unauthorized: No token provided");
        });

        const response = await request(app)
        .get("/api/v1/networks/NET01/gateways")
        .set("Authorization", token);
        
        expect(response.status).toBe(401);
        expect(response.body.message).toMatch("Unauthorized: No token provided");
        authorizeSpy.mockRestore();
    });

    it("get all gateways of a specific network: 404 NotFoundError", async () => {
        const network = await networkRepo.createNewNetwork("NET01", "ALP", "DESC");
        expect(network).toMatchObject({
            code : "NET01",
            name : "ALP",
            description : "DESC"
        })

        const gateway = await gatewayRepo.createGateway("AA:AA:AA:AA:AA:AA", "GW01", "DESC DESC", network);
        expect(gateway).toMatchObject({
            macAddress : "AA:AA:AA:AA:AA:AA",
            name : "GW01",
            description : "DESC DESC",
            network
        })

        const authorizeSpy = jest.spyOn(authService, 'processToken').mockResolvedValue(undefined);

        const response = await request(app)
        .get("/api/v1/networks/NET02/gateways/")
        .set("Authorization", token);

        expect(response.status).toBe(404)
        expect(response.body.message).toMatch("Network with code 'NET02' not found")
        authorizeSpy.mockRestore();
    })

    it("get all gateway of a specific network : 500 Error", async () => {
        const authorizeSpy = jest.spyOn(authService, 'processToken').mockResolvedValue(undefined);
        const fakeError = new Error("InternalServerError");
        const getAllGatewaysMock = jest.spyOn(gatewayController, 'getAllGateways').mockRejectedValue(fakeError);

        const response = await request(app)
        .get("/api/v1/networks/NET01/gateways")
        .set("Authorization", token);

        expect(response.status).toBe(500)  
        expect(response.body.message).toMatch(/InternalServerError/)
        
        authorizeSpy.mockRestore();
        getAllGatewaysMock.mockRestore();
    })

    it("delete a gateway: 204 OK", async () => {
        const network = await networkRepo.createNewNetwork("NET01", "ALP", "DESC");
        expect(network).toMatchObject({
            code : "NET01",
            name : "ALP",
            description : "DESC"
        })

        const gateway = await gatewayRepo.createGateway("AA:AA:AA:AA:AA:AA", "GW01", "DESC DESC", network);
        expect(gateway).toMatchObject({
            macAddress : "AA:AA:AA:AA:AA:AA",
            name : "GW01",
            description : "DESC DESC",
            network
        })

        const authorizeSpy = jest.spyOn(authService, 'processToken').mockResolvedValue(undefined);

        const response = await request(app)
        .delete("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA")
        .set("Authorization", token); 
        
        expect(response.status).toBe(204);
        expect((await gatewayRepo.getAllGateways("NET01")).length).toBe(0);

        authorizeSpy.mockRestore();
    })

    it("delete a specific gateway: 401 UnauthorizedError", async () => {
        const authorizeSpy = jest.spyOn(authService, 'processToken').mockImplementation(() => {
            throw new UnauthorizedError("Unauthorized: No token provided");
        });

        const response = await request(app)
        .delete("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA")
        .set("Authorization", token);
        
        expect(response.status).toBe(401);
        expect(response.body.message).toMatch("Unauthorized: No token provided");
        authorizeSpy.mockRestore();
    });

    it("delete a specific gateway: 403 InsufficientRightsError", async () => {
        const network = await networkRepo.createNewNetwork("NET01", "ALP", "DESC");
        expect(network).toMatchObject({
            code : "NET01",
            name : "ALP",
            description : "DESC"
        })

        const gateway = await gatewayRepo.createGateway("AA:AA:AA:AA:AA:AA", "GW01", "DESC DESC", network);
        expect(gateway).toMatchObject({
            macAddress : "AA:AA:AA:AA:AA:AA",
            name : "GW01",
            description : "DESC DESC",
            network
        })

        const authorizeSpy = jest.spyOn(authService, 'processToken').mockImplementation(() => {
            throw new InsufficientRightsError("Forbidden: Insufficent rights");
        });

        const response = await request(app)
        .delete("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA")
        .set("Authorization", token);
        
        expect(response.status).toBe(403);
        expect(response.body.message).toMatch("Forbidden: Insufficent rights");
        authorizeSpy.mockRestore();
    })

    it("delete a gateway : 500 Error", async () => {
        const authorizeSpy = jest.spyOn(authService, 'processToken').mockResolvedValue(undefined);
        const fakeError = new Error("InternalServerError");
        const deleteGatewayMock = jest.spyOn(gatewayController, 'deleteGateway').mockRejectedValue(fakeError);
        const response = await request(app)
        .delete("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA")
        .set("Authorization", token);

        expect(response.status).toBe(500)  
        expect(response.body.message).toMatch(/InternalServerError/)
        
        authorizeSpy.mockRestore();
        deleteGatewayMock.mockRestore();
    })


    it("create a new gateway: 201", async () => {
        const network = await networkRepo.createNewNetwork("NET01", "ALP", "DESC");
        expect(network).toMatchObject({
            code : "NET01",
            name : "ALP",
            description : "DESC"
        })

        const mockedGateway : GatewayDTO = {
            macAddress: "94:3F:BE:4C:4A:79",
            name: "GW01",
            description: "on-field aggregation node"
        };

        const authorizeSpy = jest.spyOn(authService, 'processToken').mockResolvedValue(undefined);

        const response = await request(app)
        .post("/api/v1/networks/NET01/gateways")
        .set("Authorization", token)
        .send(mockedGateway);

        expect(response.status).toBe(201)
        

        const get_gateway = await gatewayRepo.getGatewayByMacAddress("NET01", "94:3F:BE:4C:4A:79");
        expect(get_gateway).toMatchObject({
            macAddress: "94:3F:BE:4C:4A:79",
            name: "GW01",
            description: "on-field aggregation node"
        })
        authorizeSpy.mockRestore();
    })

    it("create a new gateway : 400 BadRequest", async () => {
        const network = await networkRepo.createNewNetwork("NET01", "ALP", "DESC");
        expect(network).toMatchObject({
            code : "NET01",
            name : "ALP",
            description : "DESC"
        })

        const mockedGateway : GatewayDTO = {
            macAddress: "",
            name: "GW01",
            description: "on-field aggregation node"
        };

        const authorizeSpy = jest.spyOn(authService, 'processToken').mockResolvedValue(undefined);

        const response = await request(app)
        .post("/api/v1/networks/NET01/gateways")
        .set("Authorization", token)
        .send(mockedGateway);

        expect(response.status).toBe(400)
        expect(response.body.name).toMatch("Bad Request")
        authorizeSpy.mockRestore();
    })

    it("create a gateway: 401 UnauthorizedError", async () => {
        const authorizeSpy = jest.spyOn(authService, 'processToken').mockImplementation(() => {
            throw new UnauthorizedError("Unauthorized: No token provided");
        });

        const mockedGateway : GatewayDTO = {
            macAddress: "AA:AA:AA:AA:AA:AA",
            name: "GW01",
            description: "on-field aggregation node"
        };

        const response = await request(app)
        .post("/api/v1/networks/NET01/gateways")
        .set("Authorization", token)
        .send(mockedGateway);
        
        expect(response.status).toBe(401);
        expect(response.body.message).toMatch("Unauthorized: No token provided");
        authorizeSpy.mockRestore();
    });
    
    it("create a gateway: 404 NotFoundError", async () => {
        const network = await networkRepo.createNewNetwork("NET01", "ALP", "DESC");
        expect(network).toMatchObject({
            code : "NET01",
            name : "ALP",
            description : "DESC"
        })

        const mockedGateway : GatewayDTO = {
            macAddress: "AA:AA:AA:AA:AA:AA",
            name: "GW01",
            description: "on-field aggregation node"
        };


        const authorizeSpy = jest.spyOn(authService, 'processToken').mockResolvedValue(undefined);

        const response = await request(app)
        .post("/api/v1/networks/NET02/gateways")
        .set("Authorization", token)
        .send(mockedGateway);

        expect(response.status).toBe(404)
        expect(response.body.message).toMatch("Network with code 'NET02' not found")
        authorizeSpy.mockRestore();
    })

    it("create a new gateway: 409 ConflictError", async() => {
        const network = await networkRepo.createNewNetwork("NET01", "ALP", "DESC");
        expect(network).toMatchObject({
            code : "NET01",
            name : "ALP",
            description : "DESC"
        })

        await gatewayRepo.createGateway("AA:AA:AA:AA:AA:AA", "GW01", "DESC DESC", network);
        
        const mockedGateway : GatewayDTO = {
            macAddress: "AA:AA:AA:AA:AA:AA",
            name: "GW02",
            description: "Prova"
        };

        const authorizeSpy = jest.spyOn(authService, 'processToken').mockResolvedValue(undefined);

        const response = await request(app)
        .post("/api/v1/networks/NET01/gateways")
        .set("Authorization", token)
        .send(mockedGateway);

        expect(response.status).toBe(409)
        expect(response.body.message).toMatch("Gateway with MAC address 'AA:AA:AA:AA:AA:AA' already exists");
        authorizeSpy.mockRestore();
    })

    it("create a new gateway : 500 Error", async () => {
        const authorizeSpy = jest.spyOn(authService, 'processToken').mockResolvedValue(undefined);
        const fakeError = new Error("InternalServerError");
        const createNewNetworkMock = jest.spyOn(gatewayController, 'createGateway').mockRejectedValue(fakeError);
        const mockedGateway = {
            macAddress: "BB:BB:BB:BB:BB:BB",
            name: "Updated Name",
            description: "Updated Description"
        } 

        const response = await request(app)
        .post("/api/v1/networks/NET01/gateways")
        .set("Authorization", token)
        .send(mockedGateway);

        expect(response.status).toBe(500)  
        expect(response.body.message).toMatch(/InternalServerError/)
        
        authorizeSpy.mockRestore();
        createNewNetworkMock.mockRestore();
    })


    it("update an existing gateway: 204", async () => {
        const network = await networkRepo.createNewNetwork("NET01", "ALP", "DESC");
        expect(network).toMatchObject({
            code : "NET01",
            name : "ALP",
            description : "DESC"
        })

        await gatewayRepo.createGateway("AA:AA:AA:AA:AA:AA", "GW01", "DESC DESC", network);
        const mockedGateway = {
            macAddress: "1C:6A:66:95:EE:45",
            name: "Updated Name",
            description: "Updated Description"
        } 

        const authorizeSpy = jest.spyOn(authService, 'processToken').mockResolvedValue(undefined);
        const response = await request(app)
        .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA")
        .set("Authorization", token)
        .send(mockedGateway);

        expect(response.status).toBe(204)
        const get_gateways = await gatewayRepo.getAllGateways("NET01");
        expect(get_gateways[0].macAddress).toMatch("1C:6A:66:95:EE:45");
        authorizeSpy.mockRestore();
    })

    it ("update an existing gateway: 404 NotFoundError", async () => {
        const network = await networkRepo.createNewNetwork("NET01", "ALP", "DESC");
        expect(network).toMatchObject({
            code : "NET01",
            name : "ALP",
            description : "DESC"
        })

        const gateway = await gatewayRepo.createGateway("AA:AA:AA:AA:AA:AA", "GW01", "DESC DESC", network);
        expect(gateway).toMatchObject({
            macAddress : "AA:AA:AA:AA:AA:AA",
            name : "GW01",
            description : "DESC DESC",
            network
        })
        const mockedGateway = {
            macAddress: "1C:6A:66:95:EE:45",
            name: "Updated Name",
            description: "Updated Description"
        } 

        const authorizeSpy = jest.spyOn(authService, 'processToken').mockResolvedValue(undefined);

        const response = await request(app)
        .patch("/api/v1/networks/NET02/gateways/AA:AA:AA:AA:AA:AA")
        .set("Authorization", token)
        .send(mockedGateway);

        expect(response.status).toBe(404);
        expect(response.body.message).toMatch("Network with code 'NET02' not found");
        

        const response2 = await request(app)
        .get("/api/v1/networks/NET01/gateways/BB:BB:BB:BB:BB:BB")
        .set("Authorization", token);

        expect(response2.status).toBe(404);
        expect(response2.body.message).toMatch("Gateway with MAC address 'BB:BB:BB:BB:BB:BB' not found");
        authorizeSpy.mockRestore();


    })


    it("update an existing gateway: 409", async () => {
        const network = await networkRepo.createNewNetwork("NET01", "ALP", "DESC");
        expect(network).toMatchObject({
            code : "NET01",
            name : "ALP",
            description : "DESC"
        })

        await gatewayRepo.createGateway("AA:AA:AA:AA:AA:AA", "GW01", "DESC DESC", network);
        await gatewayRepo.createGateway("BB:BB:BB:BB:BB:BB", "GW02", "DESC", network);
        const mockedGateway = {
            macAddress: "BB:BB:BB:BB:BB:BB",
            name: "Updated Name",
            description: "Updated Description"
        } 

        const authorizeSpy = jest.spyOn(authService, 'processToken').mockResolvedValue(undefined);
        const response = await request(app)
        .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA")
        .set("Authorization", token)
        .send(mockedGateway);

        expect(response.status).toBe(409)
        expect(response.body.message).toMatch("Gateway with MAC address 'BB:BB:BB:BB:BB:BB' already exists");
        authorizeSpy.mockRestore();
    })

    it("update an existing gateway : 500 Error", async () => {
        const authorizeSpy = jest.spyOn(authService, 'processToken').mockResolvedValue(undefined);
        const fakeError = new Error("InternalServerError");
        const updateGatewayMock = jest.spyOn(gatewayController, 'updateGateway').mockRejectedValue(fakeError);
        const mockedGateway = {
            macAddress: "BB:BB:BB:BB:BB:BB",
            name: "Updated Name",
            description: "Updated Description"
        } 

        const response = await request(app)
        .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA")
        .set("Authorization", token)
        .send(mockedGateway);

        expect(response.status).toBe(500)  
        expect(response.body.message).toMatch(/InternalServerError/)
        
        authorizeSpy.mockRestore();
        updateGatewayMock.mockRestore();
    })


})