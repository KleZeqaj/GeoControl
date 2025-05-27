import { app } from "@app";
import * as measurementController from "@controllers/measurementController";
import * as authService from "@services/authService";
import { MeasurementRepository } from "@repositories/MeasurementRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import {
  closeTestDataSource,
  initializeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { SensorDAO } from "@models/dao/SensorDAO";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import request from "supertest";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";


async function setupNetworkGatewaySensor(
  networkCode = "NET01",
  gatewayMac = "AA:AA:AA:AA:AA:AA",
  sensorMac = "00:11:22:33:44:55"
) {
  const networkRepo = new NetworkRepository();
  const gatewayRepo = new GatewayRepository();
  const sensorRepo = new SensorRepository();

  const network = await networkRepo.createNewNetwork(networkCode, "NetworkName", "NetworkDesc");
  const gateway = await gatewayRepo.createGateway(gatewayMac, "GatewayName", "GatewayDesc", network);
  const sensor = await sensorRepo.createSensor(sensorMac, gateway, "SensorName", "SensorDesc", "temperature", "C");

  return { network, gateway, sensor };
}

describe("MeasurementRoutes integration", () => {
  const token = "Bearer faketoken";
  const measurementRepo = new MeasurementRepository();

  beforeAll(async () => {
    await initializeTestDataSource();
  });

  afterAll(async () => {
    await closeTestDataSource();
  });

  beforeEach(async () => {
    await TestDataSource.getRepository(MeasurementDAO).clear();
    await TestDataSource.getRepository(SensorDAO).clear();
    await TestDataSource.getRepository(GatewayDAO).clear();
    await TestDataSource.getRepository(NetworkDAO).clear();
    await TestDataSource.getRepository(GatewayDAO).clear();
    
    jest.clearAllMocks();
  });

  it("store measurements: 201 Created", async () => {
    const { network, gateway, sensor } = await setupNetworkGatewaySensor();

    const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
    const body = [
      { createdAt: new Date().toISOString(), value: 22.5 },
      { createdAt: new Date().toISOString(), value: 23.0 }
    ];

    const response = await request(app)
      .post(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements`)
      .set("Authorization", token)
      .send(body);

    expect(response.status).toBe(201);
    const stored = await measurementRepo.getAllMeasurementsOfSensor(network.code, gateway.macAddress, sensor.macAddress);
    expect(stored.length).toBe(2);

    authorizeSpy.mockRestore();
  });

  it("store measurements: 401 Unauthorized", async () => {
    await setupNetworkGatewaySensor();

    const authorizeSpy = jest.spyOn(authService, "processToken").mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token provided");
    });

    const response = await request(app)
      .post(`/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/00:11:22:33:44:55/measurements`)
      .set("Authorization", token)
      .send([]);

    expect(response.status).toBe(401);
    authorizeSpy.mockRestore();
  });

  it("store measurements: 500 Internal Server Error (catch block)", async () => {
    const { network, gateway, sensor } = await setupNetworkGatewaySensor();

    const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
    const storeSpy = jest
      .spyOn(measurementController, "storeMeasurements")
      .mockRejectedValue(new Error("Simulated failure"));

    const response = await request(app)
      .post(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements`)
      .set("Authorization", token)
      .send([{ value: 22.5, createdAt: new Date().toISOString() }]);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/Simulated failure/);

    storeSpy.mockRestore();
    authorizeSpy.mockRestore();
  });

  describe("GET /measurements for a sensor", () => {
    it("returns 200 OK with measurements", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        new Map([[new Date(), 22.5]])
      );

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.sensorMacAddress).toBe(sensor.macAddress);
      authorizeSpy.mockRestore();
    });

    it("returns 400 Bad Request if startDate invalid", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements?startDate=invalid`)
        .set("Authorization", token);

      expect(res.status).toBe(400);
      authorizeSpy.mockRestore();
    });

    it("returns 401 Unauthorized", async () => {
      await setupNetworkGatewaySensor();
      const authorizeSpy = jest.spyOn(authService, "processToken").mockImplementation(() => {
        throw new UnauthorizedError("Unauthorized");
      });

      const res = await request(app)
        .get(`/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/00:11:22:33:44:55/measurements`)
        .set("Authorization", token);

      expect(res.status).toBe(401);
      authorizeSpy.mockRestore();
    });

    it("returns 404 Not Found for non-existent sensor", async () => {
      const { network, gateway } = await setupNetworkGatewaySensor();
      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/XX:XX:XX:XX:XX:XX/measurements`)
        .set("Authorization", token);

      expect(res.status).toBe(404);
      authorizeSpy.mockRestore();
    });

    it("returns 500 Internal Server Error on controller failure", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const spy = jest
        .spyOn(measurementController, "getAllMeasurementsOfSensor")
        .mockRejectedValue(new Error("Simulated error"));

      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements`)
        .set("Authorization", token);

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Simulated error/);

      spy.mockRestore();
      authorizeSpy.mockRestore();
    });
  });

  describe("GET /stats for a sensor", () => {
    it("returns 200 OK with stats", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        new Map([[new Date(), 22.5]])
      );

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/stats`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("mean");
      authorizeSpy.mockRestore();
    });

    it("returns 400 Bad Request if startDate invalid", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/stats?startDate=invalid`)
        .set("Authorization", token);

      expect(res.status).toBe(400);
      authorizeSpy.mockRestore();
    });

    it("returns 404 Not Found if sensor missing", async () => {
      const { network, gateway } = await setupNetworkGatewaySensor();
      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/XX:XX:XX:XX:XX:XX/stats`)
        .set("Authorization", token);

      expect(res.status).toBe(404);
      authorizeSpy.mockRestore();
    });

    it("returns 500 Internal Server Error on controller fail", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const spy = jest
        .spyOn(measurementController, "getAllStatsOfSensor")
        .mockRejectedValue(new Error("Stats error"));

      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/stats`)
        .set("Authorization", token);

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Stats error/);

      spy.mockRestore();
      authorizeSpy.mockRestore();
    });
  });

  describe("GET /outliers for a sensor", () => {
    it("returns 200 OK with outliers", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        new Map([[new Date(), 20], [new Date(Date.now()+1), 999]])
      );

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/outliers`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.measurements.find((m: any) => m.value === 999)).toBeTruthy();
      authorizeSpy.mockRestore();
    });

    it("returns 400 Bad Request if startDate invalid", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/outliers?startDate=bad`)
        .set("Authorization", token);

      expect(res.status).toBe(400);
      authorizeSpy.mockRestore();
    });

    it("returns 404 Not Found if sensor missing", async () => {
      const { network, gateway } = await setupNetworkGatewaySensor();
      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/XX:XX:XX:XX:XX:XX/outliers`)
        .set("Authorization", token);

      expect(res.status).toBe(404);
      authorizeSpy.mockRestore();
    });

    it("returns 500 Internal Server Error on controller fail", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const spy = jest
        .spyOn(measurementController, "getAllOutliersOfSensor")
        .mockRejectedValue(new Error("Outliers error"));

      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/outliers`)
        .set("Authorization", token);

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Outliers error/);

      spy.mockRestore();
      authorizeSpy.mockRestore();
    });
  });

  describe("GET /networks/:networkCode/measurements", () => {
    it("returns 200 OK with grouped measurements", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        new Map([[new Date(), 42]])
      );

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/measurements`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].sensorMacAddress).toBe(sensor.macAddress);
      authorizeSpy.mockRestore();
    });

    it("returns 400 Bad Request on invalid date", async () => {
      await setupNetworkGatewaySensor();
      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/NET01/measurements?endDate=xyz`)
        .set("Authorization", token);

      expect(res.status).toBe(400);
      authorizeSpy.mockRestore();
    });

    it("returns 404 Not Found if network missing", async () => {
      await setupNetworkGatewaySensor();
      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/NOPE/measurements`)
        .set("Authorization", token);

      expect(res.status).toBe(404);
      authorizeSpy.mockRestore();
    });

    it("returns 500 Internal Server Error on controller fail", async () => {
      const { network } = await setupNetworkGatewaySensor();
      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const spy = jest
        .spyOn(measurementController, "getAllMeasurementsOfNetwork")
        .mockRejectedValue(new Error("Controller error"));

      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/measurements`)
        .set("Authorization", token);

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Controller error/);
      spy.mockRestore();
      authorizeSpy.mockRestore();
    });
  });

  describe("GET /networks/:networkCode/stats", () => {
    it("returns 200 OK with grouped stats", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        new Map([[new Date(), 10]])
      );

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/stats`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty("stats");
      authorizeSpy.mockRestore();
    });

    it("returns 500 Internal Server Error on controller fail", async () => {
      const { network } = await setupNetworkGatewaySensor();
      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const spy = jest
        .spyOn(measurementController, "getAllStatsOfNetwork")
        .mockRejectedValue(new Error("Stats controller error"));

      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/stats`)
        .set("Authorization", token);

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Stats controller error/);
      spy.mockRestore();
      authorizeSpy.mockRestore();
    });
  });

  describe("GET /networks/:networkCode/outliers", () => {
    it("returns 200 OK with grouped outliers", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        new Map([[new Date(), 12345]])
      );

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/outliers`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].measurements).not.toBeNull();
      authorizeSpy.mockRestore();
    });

    it("returns 500 Internal Server Error on controller fail", async () => {
      const { network } = await setupNetworkGatewaySensor();
      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const spy = jest
        .spyOn(measurementController, "getAllOutliersOfNetwork")
        .mockRejectedValue(new Error("Outliers controller error"));

      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/outliers`)
        .set("Authorization", token);

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Outliers controller error/);
      spy.mockRestore();
      authorizeSpy.mockRestore();
    });
  });
});

