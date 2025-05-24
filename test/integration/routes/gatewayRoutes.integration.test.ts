import { app } from "@app";
import * as gatewayController from "@controllers/gatewayController";
import { Gateway as GatewayDTO } from "@models/dto/Gateway";
import { Sensor as SensorDTO } from "@models/dto/Sensor";
import * as authService from "@services/authService";
import request from "supertest";


describe("GatewayRoutes integration", () =>{
    beforeEach(() =>{
        jest.clearAllMocks()
    })

    const token = "Bearer faketoken";

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



})