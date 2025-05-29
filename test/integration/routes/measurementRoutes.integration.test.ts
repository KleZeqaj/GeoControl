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
import { UserType } from "@models/UserType";


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

async function setupNetworkGatewayMultipleSensor(
  networkCode = "NET01",
  gatewayMac = "AA:AA:AA:AA:AA:AA",
  sensorMac1 = "00:11:22:33:44:55",
  sensorMac2 = "11:11:11:11:11:11",
  sensorMac3 = "22:22:22:22:22:22",
) {
  const networkRepo = new NetworkRepository();
  const gatewayRepo = new GatewayRepository();
  const sensorRepo = new SensorRepository();

  const network = await networkRepo.createNewNetwork(networkCode, "NetworkName", "NetworkDesc");
  const gateway = await gatewayRepo.createGateway(gatewayMac, "GatewayName", "GatewayDesc", network);
  const sensor1 = await sensorRepo.createSensor(sensorMac1, gateway, "SensorName1", "SensorDesc1", "temperature1", "C");
  const sensor2 = await sensorRepo.createSensor(sensorMac2, gateway, "SensorName2", "SensorDesc2", "temperature2", "C");
  const sensor3 = await sensorRepo.createSensor(sensorMac3, gateway, "SensorName3", "SensorDesc3", "temperature3", "C");

  return { network, gateway, sensor1, sensor2, sensor3 };
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
    expect(stored[0].value).toBe(22.5);
    expect(stored[1].value).toBe(23.0);

    authorizeSpy.mockRestore();
  });

  it("store measurements: 400 Failed", async () => {
    const { network, gateway, sensor } = await setupNetworkGatewaySensor();

    const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
    const body1 = [{ value: 22.5 }];
    const body2 = [{ createdAt: new Date().toISOString() }];
    const body3 = [{}];

    const response1 = await request(app)
      .post(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements`)
      .set("Authorization", token)
      .send(body1);

    expect(response1.status).toBe(400);
    expect(response1.body.name).toBe("Bad Request");

    const response2 = await request(app)
      .post(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements`)
      .set("Authorization", token)
      .send(body2);

    expect(response2.status).toBe(400);
    expect(response1.body.name).toBe("Bad Request");

    const response3 = await request(app)
      .post(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements`)
      .set("Authorization", token)
      .send(body3);

    expect(response3.status).toBe(400);
    expect(response1.body.name).toBe("Bad Request");

    authorizeSpy.mockRestore();
  });

  it("store measurements: 404 Failed", async () => {
    const { network, gateway, sensor } = await setupNetworkGatewaySensor();

    const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
    const body = [{ value: 22.5, createdAt: new Date().toISOString() }];

    const response1 = await request(app)
      .post(`/api/v1/networks/NET06/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements`)
      .set("Authorization", token)
      .send(body);

    expect(response1.status).toBe(404);
    expect(response1.body.name).toBe("NotFoundError");

    const response2 = await request(app)
      .post(`/api/v1/networks/${network.code}/gateways/GW10/sensors/${sensor.macAddress}/measurements`)
      .set("Authorization", token)
      .send(body);

    expect(response2.status).toBe(404);
    expect(response1.body.name).toBe("NotFoundError");

    const response3 = await request(app)
      .post(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/PIPPO/measurements`)
      .set("Authorization", token)
      .send(body);

    expect(response3.status).toBe(404);
    expect(response1.body.name).toBe("NotFoundError");

    authorizeSpy.mockRestore();
  });

  describe("GET /measurements for a sensor", () => {
    it("returns 200 OK with measurements, no dates passed", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const date = new Date();
      date.setMilliseconds(0);
      const measurements = new Map();
      const values = [1, 1, 1, 1, 1, 1, 1, 1, 1, 50];
      const dates = [];
      values.forEach((val, idx) => {
        const dateNew = new Date(date.getTime() + 1000*60*10*idx);
        dateNew.setMilliseconds(0);
        dates.push(dateNew)
      });

      values.forEach((val, idx) => {
        measurements.set(dates[idx], val);
      })
      
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        measurements
      );

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.sensorMacAddress).toBe(sensor.macAddress);
      expect(res.body.stats).toMatchObject({
        startDate: date.toISOString().split('.')[0] + 'Z',
        endDate: dates[9].toISOString().split('.')[0] + 'Z',
        mean: 5.9,
        variance: 216.09,
        upperThreshold: 35.3,
        lowerThreshold: -23.5
      });
      expect(res.body.measurements?.length).toBe(10);
      expect(res.body.measurements).toMatchObject([{
        createdAt: date.toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[1].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[2].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[3].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[4].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[5].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[6].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[7].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[8].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[9].toISOString().split('.')[0] + 'Z',
        value: 50,
        isOutlier: true},
      
      ]);
      authorizeSpy.mockRestore();
    });

    it("returns 200 OK with measurements, start date passed", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const date = new Date("2025-05-29T18:45:00+02:00");
      date.setMilliseconds(0);
      const measurements = new Map();
      const values = [2, 1, 9, 5, 1, 15, 1, 43, 13, 50];
      const dates = [];
      values.forEach((val, idx) => {
        const dateNew = new Date(date.getTime() + 1000*60*10*idx);
        dateNew.setMilliseconds(0);
        dates.push(dateNew)
      });

      values.forEach((val, idx) => {
        measurements.set(dates[idx], val);
      })
      
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        measurements
      );

      const startDate = "2025-05-29T19:15:00+02:00";

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements?startDate=${encodeURIComponent(startDate)}`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.sensorMacAddress).toBe(sensor.macAddress);
      expect(res.body.stats).toMatchObject({
        startDate: dates[3].toISOString().split('.')[0] + 'Z',
        endDate: dates[9].toISOString().split('.')[0] + 'Z',
        mean: 18.29,
        variance: 347.06,
        upperThreshold: 55.54,
        lowerThreshold: -18.97
      });
      expect(res.body.measurements?.length).toBe(7);
      expect(res.body.measurements).toMatchObject([{
        createdAt: dates[3].toISOString().split('.')[0] + 'Z',
        value: 5,
        isOutlier: false}, {
        createdAt: dates[4].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[5].toISOString().split('.')[0] + 'Z',
        value: 15,
        isOutlier: false}, {
        createdAt: dates[6].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[7].toISOString().split('.')[0] + 'Z',
        value: 43,
        isOutlier: false}, {
        createdAt: dates[8].toISOString().split('.')[0] + 'Z',
        value: 13,
        isOutlier: false}, {
        createdAt: dates[9].toISOString().split('.')[0] + 'Z',
        value: 50,
        isOutlier: false},
      
      ]);
      authorizeSpy.mockRestore();
    });

    it("returns 200 OK with measurements, end date passed", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const date = new Date("2025-05-29T18:45:00+02:00");
      date.setMilliseconds(0);
      const measurements = new Map();
      const values = [2, 1, 9, 5, 1, 15, 1, 43, 13, 50];
      const dates = [];
      values.forEach((val, idx) => {
        const dateNew = new Date(date.getTime() + 1000*60*10*idx);
        dateNew.setMilliseconds(0);
        dates.push(dateNew)
      });

      values.forEach((val, idx) => {
        measurements.set(dates[idx], val);
      })
      
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        measurements
      );

      const endDate = "2025-05-29T19:40:00+02:00";
      const endDateDate = new Date(endDate);

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements?endDate=${encodeURIComponent(endDate)}`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.sensorMacAddress).toBe(sensor.macAddress);
      expect(res.body.stats).toMatchObject({
        startDate: dates[0].toISOString().split('.')[0] + 'Z',
        endDate: endDateDate.toISOString().split('.')[0] + 'Z',
        mean: 5.5,
        variance: 25.92,
        upperThreshold: 15.68,
        lowerThreshold: -4.68
      });
      expect(res.body.measurements?.length).toBe(6);
      expect(res.body.measurements).toMatchObject([{
        createdAt: dates[0].toISOString().split('.')[0] + 'Z',
        value: 2,
        isOutlier: false}, {
        createdAt: dates[1].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[2].toISOString().split('.')[0] + 'Z',
        value: 9,
        isOutlier: false}, {
        createdAt: dates[3].toISOString().split('.')[0] + 'Z',
        value: 5,
        isOutlier: false}, {
        createdAt: dates[4].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[5].toISOString().split('.')[0] + 'Z',
        value: 15,
        isOutlier: false}
      ]);
      authorizeSpy.mockRestore();
    });

    it("returns 200 OK with measurements, start and end date passed", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const date = new Date("2025-05-29T18:45:00+02:00");
      date.setMilliseconds(0);
      const measurements = new Map();
      const values = [2, 1, 9, 5, 1, 15, 1, 43, 13, 50];
      const dates = [];
      values.forEach((val, idx) => {
        const dateNew = new Date(date.getTime() + 1000*60*10*idx);
        dateNew.setMilliseconds(0);
        dates.push(dateNew)
      });

      values.forEach((val, idx) => {
        measurements.set(dates[idx], val);
      })
      
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        measurements
      );

      const startDate = "2025-05-29T19:00:00+02:00";
      const startDateDate = new Date(startDate);

      const endDate = "2025-05-29T19:40:00+02:00";
      const endDateDate = new Date(endDate);

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.sensorMacAddress).toBe(sensor.macAddress);
      expect(res.body.stats).toMatchObject({
        startDate: startDateDate.toISOString().split('.')[0] + 'Z',
        endDate: endDateDate.toISOString().split('.')[0] + 'Z',
        mean: 7.5,
        variance: 26.75,
        upperThreshold: 17.84,
        lowerThreshold: -2.84
      });
      expect(res.body.measurements?.length).toBe(4);
      expect(res.body.measurements).toMatchObject([{
        createdAt: dates[2].toISOString().split('.')[0] + 'Z',
        value: 9,
        isOutlier: false}, {
        createdAt: dates[3].toISOString().split('.')[0] + 'Z',
        value: 5,
        isOutlier: false}, {
        createdAt: dates[4].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[5].toISOString().split('.')[0] + 'Z',
        value: 15,
        isOutlier: false}
      ]);
      authorizeSpy.mockRestore();
    });

    it("returns 200 OK with measurements, start and end date swapped", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const date = new Date("2025-05-29T18:45:00+02:00");
      date.setMilliseconds(0);
      const measurements = new Map();
      const values = [2, 1, 9, 5, 1, 15, 1, 43, 13, 50];
      const dates = [];
      values.forEach((val, idx) => {
        const dateNew = new Date(date.getTime() + 1000*60*10*idx);
        dateNew.setMilliseconds(0);
        dates.push(dateNew)
      });

      values.forEach((val, idx) => {
        measurements.set(dates[idx], val);
      })
      
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        measurements
      );

      const startDate = "2025-05-29T19:00:00+02:00";
      const endDate = "2025-05-29T19:40:00+02:00";

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements?startDate=${encodeURIComponent(endDate)}&endDate=${encodeURIComponent(startDate)}`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.sensorMacAddress).toBe(sensor.macAddress);
      expect(res.body.stats).toBeUndefined();
      expect(res.body.measurements).toBeUndefined();
      authorizeSpy.mockRestore();
    });

    it("returns 200 OK with measurements, no measurements for sensor", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      
      
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        new Map()
      );

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.sensorMacAddress).toBe(sensor.macAddress);
      expect(res.body.stats).toBeUndefined();
      expect(res.body.measurements).toBeUndefined();
      authorizeSpy.mockRestore();
    });

    it("returns 400 all Bad Requests", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res1 = await request(app)
        .get(`/api/v1/networks/%&*/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements`)
        .set("Authorization", token);

      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/%&*/sensors/${sensor.macAddress}/measurements`)
        .set("Authorization", token);

      expect(res2.status).toBe(400);

      const res3 = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/.,%-<x/measurements`)
        .set("Authorization", token);

      expect(res3.status).toBe(400);

      const res4 = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements?startDate=${encodeURIComponent(849)}`)
        .set("Authorization", token);

      expect(res4.status).toBe(400);

      const res5 = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements?endDate=${encodeURIComponent("_*2")}`)
        .set("Authorization", token);

      expect(res5.status).toBe(400);

      const res6 = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements?startDate=${encodeURIComponent("ciao")}&endDate=${encodeURIComponent("pippo")}`)
        .set("Authorization", token);

      expect(res6.status).toBe(400);

      authorizeSpy.mockRestore();
    });

    it("returns 404 all Not Found errors", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res1 = await request(app)
        .get(`/api/v1/networks/NET78/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements`)
        .set("Authorization", token);

      expect(res1.status).toBe(404);
      expect(res1.body.name).toBe("NotFoundError");

      const res2 = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/Pippo/sensors/${sensor.macAddress}/measurements`)
        .set("Authorization", token);

      expect(res2.status).toBe(404);
      expect(res2.body.name).toBe("NotFoundError");

      const res3 = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/zia/measurements`)
        .set("Authorization", token);

      expect(res3.status).toBe(404);
      expect(res3.body.name).toBe("NotFoundError");
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

it("filtra correttamente le misure usando startDate e endDate (copre la linea 49)", async () => {

  const { network, gateway, sensor } = await setupNetworkGatewaySensor();

  const now = new Date();
  const start = new Date(now.getTime() - 12 * 60 * 60 * 1000);
  const end = new Date(now.getTime() + 36 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  await measurementRepo.storeMeasurements(
    network.code,
    gateway.macAddress,
    sensor.macAddress,
    new Map([
      [yesterday, 10],
      [now,       20],
      [tomorrow,  30],
    ])
  );

  const token = "Bearer faketoken";
  jest.spyOn(authService, "processToken").mockResolvedValue(undefined);

  const res = await request(app)
    .get(
      `/api/v1/networks/${network.code}` +
      `/gateways/${gateway.macAddress}` +
      `/sensors/${sensor.macAddress}/measurements` +
      `?startDate=${encodeURIComponent(start.toISOString())}` +
      `&endDate=${encodeURIComponent(end.toISOString())}`
    )
    .set("Authorization", token);

  expect(res.status).toBe(200);
  const values = res.body.measurements.map((m: any) => m.value).sort();
  expect(values).toEqual([20, 30]);
});


  });

  describe("GET /stats for a sensor", () => {
    it("returns 200 OK with measurements, no dates passed", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const date = new Date();
      date.setMilliseconds(0);
      const measurements = new Map();
      const values = [1, 1, 1, 1, 1, 1, 1, 1, 1, 50];
      const dates = [];
      values.forEach((val, idx) => {
        const dateNew = new Date(date.getTime() + 1000*60*10*idx);
        dateNew.setMilliseconds(0);
        dates.push(dateNew)
      });

      values.forEach((val, idx) => {
        measurements.set(dates[idx], val);
      })
      
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        measurements
      );

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/stats`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.startDate).toBe(date.toISOString().split('.')[0] + 'Z');
      expect(res.body.endDate).toBe(dates[9].toISOString().split('.')[0] + 'Z');
      expect(res.body.mean).toBe(5.9);
      expect(res.body.variance).toBe(216.09);
      expect(res.body.upperThreshold).toBe(35.3);
      expect(res.body.lowerThreshold).toBe(-23.5);
      expect(res.body.measurements).toBeUndefined();
      authorizeSpy.mockRestore();
    });

    it("returns 200 OK with measurements, start date passed", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const date = new Date("2025-05-29T18:45:00+02:00");
      date.setMilliseconds(0);
      const measurements = new Map();
      const values = [2, 1, 9, 5, 1, 15, 1, 43, 13, 50];
      const dates = [];
      values.forEach((val, idx) => {
        const dateNew = new Date(date.getTime() + 1000*60*10*idx);
        dateNew.setMilliseconds(0);
        dates.push(dateNew)
      });

      values.forEach((val, idx) => {
        measurements.set(dates[idx], val);
      })
      
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        measurements
      );

      const startDate = "2025-05-29T19:15:00+02:00";

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/stats?startDate=${encodeURIComponent(startDate)}`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.startDate).toBe(dates[3].toISOString().split('.')[0] + 'Z');
      expect(res.body.endDate).toBe(dates[9].toISOString().split('.')[0] + 'Z');
      expect(res.body.mean).toBe(18.29);
      expect(res.body.variance).toBe(347.06);
      expect(res.body.upperThreshold).toBe(55.54);
      expect(res.body.lowerThreshold).toBe(-18.97);
      expect(res.body.measurements).toBeUndefined();
      authorizeSpy.mockRestore();
    });

    it("returns 200 OK with measurements, end date passed", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const date = new Date("2025-05-29T18:45:00+02:00");
      date.setMilliseconds(0);
      const measurements = new Map();
      const values = [2, 1, 9, 5, 1, 15, 1, 43, 13, 50];
      const dates = [];
      values.forEach((val, idx) => {
        const dateNew = new Date(date.getTime() + 1000*60*10*idx);
        dateNew.setMilliseconds(0);
        dates.push(dateNew)
      });

      values.forEach((val, idx) => {
        measurements.set(dates[idx], val);
      })
      
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        measurements
      );

      const endDate = "2025-05-29T19:40:00+02:00";
      const endDateDate = new Date(endDate);

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/stats?endDate=${encodeURIComponent(endDate)}`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.startDate).toBe(dates[0].toISOString().split('.')[0] + 'Z');
      expect(res.body.endDate).toBe(endDateDate.toISOString().split('.')[0] + 'Z');
      expect(res.body.mean).toBe(5.5);
      expect(res.body.variance).toBe(25.92);
      expect(res.body.upperThreshold).toBe(15.68);
      expect(res.body.lowerThreshold).toBe(-4.68);
      expect(res.body.measurements).toBeUndefined();
      authorizeSpy.mockRestore();
    });

    it("returns 200 OK with measurements, start and end date passed", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const date = new Date("2025-05-29T18:45:00+02:00");
      date.setMilliseconds(0);
      const measurements = new Map();
      const values = [2, 1, 9, 5, 1, 15, 1, 43, 13, 50];
      const dates = [];
      values.forEach((val, idx) => {
        const dateNew = new Date(date.getTime() + 1000*60*10*idx);
        dateNew.setMilliseconds(0);
        dates.push(dateNew)
      });

      values.forEach((val, idx) => {
        measurements.set(dates[idx], val);
      })
      
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        measurements
      );

      const startDate = "2025-05-29T19:00:00+02:00";
      const startDateDate = new Date(startDate);

      const endDate = "2025-05-29T19:40:00+02:00";
      const endDateDate = new Date(endDate);

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/stats?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.startDate).toBe(startDateDate.toISOString().split('.')[0] + 'Z');
      expect(res.body.endDate).toBe(endDateDate.toISOString().split('.')[0] + 'Z');
      expect(res.body.mean).toBe(7.5);
      expect(res.body.variance).toBe(26.75);
      expect(res.body.upperThreshold).toBe(17.84);
      expect(res.body.lowerThreshold).toBe(-2.84);
      expect(res.body.measurements).toBeUndefined();
      authorizeSpy.mockRestore();
    });

    it("returns 200 OK with measurements, start and end date swapped", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const date = new Date("2025-05-29T18:45:00+02:00");
      date.setMilliseconds(0);
      const measurements = new Map();
      const values = [2, 1, 9, 5, 1, 15, 1, 43, 13, 50];
      const dates = [];
      values.forEach((val, idx) => {
        const dateNew = new Date(date.getTime() + 1000*60*10*idx);
        dateNew.setMilliseconds(0);
        dates.push(dateNew)
      });

      values.forEach((val, idx) => {
        measurements.set(dates[idx], val);
      })
      
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        measurements
      );

      const startDate = "2025-05-29T19:00:00+02:00";
      const endDate = "2025-05-29T19:40:00+02:00";

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/stats?startDate=${encodeURIComponent(endDate)}&endDate=${encodeURIComponent(startDate)}`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.startDate).toBeUndefined();
      expect(res.body.endDate).toBeUndefined();
      expect(res.body.mean).toBe(0);
      expect(res.body.variance).toBe(0);
      expect(res.body.upperThreshold).toBe(0);
      expect(res.body.lowerThreshold).toBe(0);
      expect(res.body.measurements).toBeUndefined();
      authorizeSpy.mockRestore();
    });

    it("returns 200 OK with measurements, no measurements for sensor", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      
      
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        new Map()
      );

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/stats`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.startDate).toBeUndefined();
      expect(res.body.endDate).toBeUndefined();
      expect(res.body.mean).toBe(0);
      expect(res.body.variance).toBe(0);
      expect(res.body.upperThreshold).toBe(0);
      expect(res.body.lowerThreshold).toBe(0);
      expect(res.body.measurements).toBeUndefined();
      authorizeSpy.mockRestore();
    });

    it("returns 400 all Bad Requests", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res1 = await request(app)
        .get(`/api/v1/networks/%&*/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/stats`)
        .set("Authorization", token);

      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/%&*/sensors/${sensor.macAddress}/stats`)
        .set("Authorization", token);

      expect(res2.status).toBe(400);

      const res3 = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/.,%-<x/stats`)
        .set("Authorization", token);

      expect(res3.status).toBe(400);

      const res4 = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/stats?startDate=${encodeURIComponent(849)}`)
        .set("Authorization", token);

      expect(res4.status).toBe(400);

      const res5 = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/stats?endDate=${encodeURIComponent("_*2")}`)
        .set("Authorization", token);

      expect(res5.status).toBe(400);

      const res6 = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/stats?startDate=${encodeURIComponent("ciao")}&endDate=${encodeURIComponent("pippo")}`)
        .set("Authorization", token);

      expect(res6.status).toBe(400);

      authorizeSpy.mockRestore();
    });

    it("returns 404 all Not Found errors", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res1 = await request(app)
        .get(`/api/v1/networks/NET78/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/stats`)
        .set("Authorization", token);

      expect(res1.status).toBe(404);
      expect(res1.body.name).toBe("NotFoundError");

      const res2 = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/Pippo/sensors/${sensor.macAddress}/stats`)
        .set("Authorization", token);

      expect(res2.status).toBe(404);
      expect(res2.body.name).toBe("NotFoundError");

      const res3 = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/zia/stats`)
        .set("Authorization", token);

      expect(res3.status).toBe(404);
      expect(res3.body.name).toBe("NotFoundError");
      authorizeSpy.mockRestore();
    });
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
    it("returns 200 OK with measurements, no dates passed", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const date = new Date();
      date.setMilliseconds(0);
      const measurements = new Map();
      const values = [1, 1, 1, 1, 1, 1, 1, 1, 1, 50];
      const dates = [];
      values.forEach((val, idx) => {
        const dateNew = new Date(date.getTime() + 1000*60*10*idx);
        dateNew.setMilliseconds(0);
        dates.push(dateNew)
      });

      values.forEach((val, idx) => {
        measurements.set(dates[idx], val);
      })
      
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        measurements
      );

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/outliers`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.sensorMacAddress).toBe(sensor.macAddress);
      expect(res.body.stats).toMatchObject({
        startDate: date.toISOString().split('.')[0] + 'Z',
        endDate: dates[9].toISOString().split('.')[0] + 'Z',
        mean: 5.9,
        variance: 216.09,
        upperThreshold: 35.3,
        lowerThreshold: -23.5
      });
      expect(res.body.measurements?.length).toBe(1);
      expect(res.body.measurements).toMatchObject([{
        createdAt: dates[9].toISOString().split('.')[0] + 'Z',
        value: 50,
        isOutlier: true},
      ]);
      authorizeSpy.mockRestore();
    });

    it("returns 200 OK with measurements, start date passed", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const date = new Date("2025-05-29T18:45:00+02:00");
      date.setMilliseconds(0);
      const measurements = new Map();
      const values = [2, 1, 1, 0.5, 1, 1, 1, 3, 1.5, 50, 1, 2, 2.5, 1, 53];
      const dates = [];
      values.forEach((val, idx) => {
        const dateNew = new Date(date.getTime() + 1000*60*10*idx);
        dateNew.setMilliseconds(0);
        dates.push(dateNew)
      });

      values.forEach((val, idx) => {
        measurements.set(dates[idx], val);
      })
      
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        measurements
      );

      const startDate = "2025-05-29T19:15:00+02:00";

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/outliers?startDate=${encodeURIComponent(startDate)}`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.sensorMacAddress).toBe(sensor.macAddress);
      expect(res.body.stats).toMatchObject({
        startDate: dates[3].toISOString().split('.')[0] + 'Z',
        endDate: dates[14].toISOString().split('.')[0] + 'Z',
        mean: 9.79,
        variance: 348.77,
        upperThreshold: 47.14,
        lowerThreshold: -27.56
      });
      expect(res.body.measurements?.length).toBe(2);
      expect(res.body.measurements).toMatchObject([{
        createdAt: dates[9].toISOString().split('.')[0] + 'Z',
        value: 50,
        isOutlier: true}, {
        createdAt: dates[14].toISOString().split('.')[0] + 'Z',
        value: 53,
        isOutlier: true}
      ]);
      authorizeSpy.mockRestore();
    });

    it("returns 200 OK with measurements, end date passed", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const date = new Date("2025-05-29T18:45:00+02:00");
      date.setMilliseconds(0);
      const measurements = new Map();
      const values = [53, 2, 50, 1, 1, 0.5, 1, 1, 1, 3, 1.5, 1, 2, 2.5, 1];
      const dates = [];
      values.forEach((val, idx) => {
        const dateNew = new Date(date.getTime() + 1000*60*10*idx);
        dateNew.setMilliseconds(0);
        dates.push(dateNew)
      });

      values.forEach((val, idx) => {
        measurements.set(dates[idx], val);
      })
      
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        measurements
      );

      const endDate = "2025-05-29T20:30:00+02:00";
      const endDateDate = new Date(endDate);

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/outliers?endDate=${encodeURIComponent(endDate)}`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.sensorMacAddress).toBe(sensor.macAddress);
      expect(res.body.stats).toMatchObject({
        startDate: dates[0].toISOString().split('.')[0] + 'Z',
        endDate: endDateDate.toISOString().split('.')[0] + 'Z',
        mean: 10.45,
        variance: 375.20,
        upperThreshold: 49.19,
        lowerThreshold: -28.29
      });
      expect(res.body.measurements?.length).toBe(2);
      expect(res.body.measurements).toMatchObject([{
        createdAt: dates[0].toISOString().split('.')[0] + 'Z',
        value: 53,
        isOutlier: true}, {
        createdAt: dates[2].toISOString().split('.')[0] + 'Z',
        value: 50,
        isOutlier: true}
      ]);
      authorizeSpy.mockRestore();
    });

    it("returns 200 OK with measurements, start and end date passed", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const date = new Date("2025-05-29T18:45:00+02:00");
      date.setMilliseconds(0);
      const measurements = new Map();
      const values = [2, 1, 9, 5, 1, 15, 1, 43, 13, 50];
      const dates = [];
      values.forEach((val, idx) => {
        const dateNew = new Date(date.getTime() + 1000*60*10*idx);
        dateNew.setMilliseconds(0);
        dates.push(dateNew)
      });

      values.forEach((val, idx) => {
        measurements.set(dates[idx], val);
      })
      
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        measurements
      );

      const startDate = "2025-05-29T19:00:00+02:00";
      const startDateDate = new Date(startDate);

      const endDate = "2025-05-29T19:40:00+02:00";
      const endDateDate = new Date(endDate);

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/outliers?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.sensorMacAddress).toBe(sensor.macAddress);
      expect(res.body.stats).toMatchObject({
        startDate: startDateDate.toISOString().split('.')[0] + 'Z',
        endDate: endDateDate.toISOString().split('.')[0] + 'Z',
        mean: 7.5,
        variance: 26.75,
        upperThreshold: 17.84,
        lowerThreshold: -2.84
      });
      expect(res.body.measurements).toBeUndefined();
      authorizeSpy.mockRestore();
    });

    it("returns 200 OK with measurements, start and end date swapped", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const date = new Date("2025-05-29T18:45:00+02:00");
      date.setMilliseconds(0);
      const measurements = new Map();
      const values = [2, 1, 9, 5, 1, 15, 1, 43, 13, 50];
      const dates = [];
      values.forEach((val, idx) => {
        const dateNew = new Date(date.getTime() + 1000*60*10*idx);
        dateNew.setMilliseconds(0);
        dates.push(dateNew)
      });

      values.forEach((val, idx) => {
        measurements.set(dates[idx], val);
      })
      
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        measurements
      );

      const startDate = "2025-05-29T19:00:00+02:00";
      const endDate = "2025-05-29T19:40:00+02:00";

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/outliers?startDate=${encodeURIComponent(endDate)}&endDate=${encodeURIComponent(startDate)}`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.sensorMacAddress).toBe(sensor.macAddress);
      expect(res.body.stats).toBeUndefined();
      expect(res.body.measurements).toBeUndefined();
      authorizeSpy.mockRestore();
    });

    it("returns 200 OK with measurements, no measurements for sensor", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      
      
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        new Map()
      );

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/outliers`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.sensorMacAddress).toBe(sensor.macAddress);
      expect(res.body.stats).toBeUndefined();
      expect(res.body.measurements).toBeUndefined();
      authorizeSpy.mockRestore();
    });

    it("returns 400 all Bad Requests", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res1 = await request(app)
        .get(`/api/v1/networks/%&*/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/outliers`)
        .set("Authorization", token);

      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/%&*/sensors/${sensor.macAddress}/outliers`)
        .set("Authorization", token);

      expect(res2.status).toBe(400);

      const res3 = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/.,%-<x/outliers`)
        .set("Authorization", token);

      expect(res3.status).toBe(400);

      const res4 = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/outliers?startDate=${encodeURIComponent(849)}`)
        .set("Authorization", token);

      expect(res4.status).toBe(400);

      const res5 = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/outliers?endDate=${encodeURIComponent("_*2")}`)
        .set("Authorization", token);

      expect(res5.status).toBe(400);

      const res6 = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/outliers?startDate=${encodeURIComponent("ciao")}&endDate=${encodeURIComponent("pippo")}`)
        .set("Authorization", token);

      expect(res6.status).toBe(400);

      authorizeSpy.mockRestore();
    });

    it("returns 404 all Not Found errors", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res1 = await request(app)
        .get(`/api/v1/networks/NET78/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/outliers`)
        .set("Authorization", token);

      expect(res1.status).toBe(404);
      expect(res1.body.name).toBe("NotFoundError");

      const res2 = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/Pippo/sensors/${sensor.macAddress}/outliers`)
        .set("Authorization", token);

      expect(res2.status).toBe(404);
      expect(res2.body.name).toBe("NotFoundError");

      const res3 = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/zia/outliers`)
        .set("Authorization", token);

      expect(res3.status).toBe(404);
      expect(res3.body.name).toBe("NotFoundError");
      authorizeSpy.mockRestore();
    });
  });

  describe("GET /networks/:networkCode/measurements", () => {
    it("returns 200 OK with measurements, no dates passed", async () => {
      const { network, gateway, sensor1, sensor2, sensor3 } = await setupNetworkGatewayMultipleSensor();
      const date = new Date();
      date.setMilliseconds(0);
      const measurements = [new Map(), new Map(), new Map()];
      const values = [[1, 1, 1, 1, 1, 1, 1, 1, 1, 50], [], [0.5, 1, 0.3, 2]];
      const dates = [[], [], []];
      values.forEach((val, idx) => {
        val.forEach((el, innIdx) => {
          const dateNew = new Date(date.getTime() + 1000*60*10*innIdx);
          dateNew.setMilliseconds(0);
          dates[idx].push(dateNew)})
      });

      values.forEach((val, idx) => {
        val.forEach((el, innIdx) => {
          measurements[idx].set(dates[idx][innIdx], el);
        });
      });

      await measurementRepo.storeMeasurements(network.code, gateway.macAddress, sensor1.macAddress, measurements[0]);
      await measurementRepo.storeMeasurements(network.code, gateway.macAddress, sensor2.macAddress, measurements[1]);
      await measurementRepo.storeMeasurements(network.code, gateway.macAddress, sensor3.macAddress, measurements[2]);

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/measurements`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(3);
      const s1 = res.body.find(s => s.sensorMacAddress === sensor1.macAddress);
      const s2 = res.body.find(s => s.sensorMacAddress === sensor2.macAddress);
      const s3 = res.body.find(s => s.sensorMacAddress === sensor3.macAddress);
      expect(s1.stats).toMatchObject({
        startDate: date.toISOString().split('.')[0] + 'Z',
        endDate: dates[0][9].toISOString().split('.')[0] + 'Z',
        mean: 5.9,
        variance: 216.09,
        upperThreshold: 35.3,
        lowerThreshold: -23.5
      });
      expect(s1.measurements?.length).toBe(10);
      expect(s1.measurements).toMatchObject([{
        createdAt: date.toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[0][1].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[0][2].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[0][3].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[0][4].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[0][5].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[0][6].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[0][7].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[0][8].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[0][9].toISOString().split('.')[0] + 'Z',
        value: 50,
        isOutlier: true},
      ]);
      expect(s2.stats).toBeUndefined();
      expect(s2.measurements).toBeUndefined();
      expect(s3.stats).toMatchObject({
        startDate: date.toISOString().split('.')[0] + 'Z',
        endDate: dates[2][3].toISOString().split('.')[0] + 'Z',
        mean: 0.95,
        variance: 0.43,
        upperThreshold: 2.27,
        lowerThreshold: -0.37
      });
      expect(s3.measurements?.length).toBe(4);
      expect(s3.measurements).toMatchObject([{
        createdAt: date.toISOString().split('.')[0] + 'Z',
        value: 0.5,
        isOutlier: false}, {
        createdAt: dates[2][1].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[2][2].toISOString().split('.')[0] + 'Z',
        value: 0.3,
        isOutlier: false}, {
        createdAt: dates[2][3].toISOString().split('.')[0] + 'Z',
        value: 2,
        isOutlier: false}
      ]);
      authorizeSpy.mockRestore();
    });

    it("returns 200 OK with measurements, start date passed", async () => {
      const { network, gateway, sensor1, sensor2, sensor3 } = await setupNetworkGatewayMultipleSensor();
      const date = new Date("2025-05-29T18:45:00+02:00");
      date.setMilliseconds(0);
      const measurements = [new Map(), new Map(), new Map()];
      const values = [[1, 1, 1, 1, 1, 1, 1, 1, 1, 50], [2, 78], [0.5, 1, 0.3, 2]];
      const dates = [[], [], []];
      values.forEach((val, idx) => {
        val.forEach((el, innIdx) => {
          const dateNew = new Date(date.getTime() + 1000*60*10*innIdx);
          dateNew.setMilliseconds(0);
          dates[idx].push(dateNew)})
      });

      values.forEach((val, idx) => {
        val.forEach((el, innIdx) => {
          measurements[idx].set(dates[idx][innIdx], el);
        });
      });

      await measurementRepo.storeMeasurements(network.code, gateway.macAddress, sensor1.macAddress, measurements[0]);
      await measurementRepo.storeMeasurements(network.code, gateway.macAddress, sensor2.macAddress, measurements[1]);
      await measurementRepo.storeMeasurements(network.code, gateway.macAddress, sensor3.macAddress, measurements[2]);

      const startDate = "2025-05-29T19:15:00+02:00";

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/measurements?startDate=${encodeURIComponent(startDate)}`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(3);
      const s1 = res.body.find(s => s.sensorMacAddress === sensor1.macAddress);
      const s2 = res.body.find(s => s.sensorMacAddress === sensor2.macAddress);
      const s3 = res.body.find(s => s.sensorMacAddress === sensor3.macAddress);
      expect(s1.stats).toMatchObject({
        startDate: dates[0][3].toISOString().split('.')[0] + 'Z',
        endDate: dates[0][9].toISOString().split('.')[0] + 'Z',
        mean: 8,
        variance: 294,
        upperThreshold: 42.29,
        lowerThreshold: -26.29
      });
      expect(s1.measurements?.length).toBe(7);
      expect(s1.measurements).toMatchObject([{
        createdAt: dates[0][3].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[0][4].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[0][5].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[0][6].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[0][7].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[0][8].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[0][9].toISOString().split('.')[0] + 'Z',
        value: 50,
        isOutlier: true},
      ]);
      expect(s2.stats).toBeUndefined();
      expect(s2.measurements).toBeUndefined();
      expect(s3.stats).toMatchObject({
        startDate: dates[2][3].toISOString().split('.')[0] + 'Z',
        endDate: dates[2][3].toISOString().split('.')[0] + 'Z',
        mean: 2,
        variance: 0,
        upperThreshold: 2,
        lowerThreshold: 2
      });
      expect(s3.measurements?.length).toBe(1);
      expect(s3.measurements).toMatchObject([{
        createdAt: dates[2][3].toISOString().split('.')[0] + 'Z',
        value: 2,
        isOutlier: false}
      ]);
      authorizeSpy.mockRestore();
    });

    it("returns 200 OK with measurements, end date passed", async () => {
      const { network, gateway, sensor1, sensor2, sensor3 } = await setupNetworkGatewayMultipleSensor();
      const date = new Date("2025-05-29T18:45:00+02:00");
      date.setMilliseconds(0);
      const measurements = [new Map(), new Map(), new Map()];
      const values = [[1, 1, 1, 1, 1, 1, 1, 1, 1, 50], [2, 78], [0.5, 1, 0.3, 2]];
      const dates = [[], [], []];
      values.forEach((val, idx) => {
        val.forEach((el, innIdx) => {
          const dateNew = new Date(date.getTime() + 1000*60*10*innIdx);
          dateNew.setMilliseconds(0);
          dates[idx].push(dateNew)})
      });

      values.forEach((val, idx) => {
        val.forEach((el, innIdx) => {
          measurements[idx].set(dates[idx][innIdx], el);
        });
      });

      await measurementRepo.storeMeasurements(network.code, gateway.macAddress, sensor1.macAddress, measurements[0]);
      await measurementRepo.storeMeasurements(network.code, gateway.macAddress, sensor2.macAddress, measurements[1]);
      await measurementRepo.storeMeasurements(network.code, gateway.macAddress, sensor3.macAddress, measurements[2]);

      const endDate = "2025-05-29T19:40:00+02:00";
      const endDateDate = new Date(endDate);

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/measurements?endDate=${encodeURIComponent(endDate)}`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(3);
      const s1 = res.body.find(s => s.sensorMacAddress === sensor1.macAddress);
      const s2 = res.body.find(s => s.sensorMacAddress === sensor2.macAddress);
      const s3 = res.body.find(s => s.sensorMacAddress === sensor3.macAddress);
      expect(s1.stats).toMatchObject({
        startDate: dates[0][0].toISOString().split('.')[0] + 'Z',
        endDate: endDateDate.toISOString().split('.')[0] + 'Z',
        mean: 1,
        variance: 0,
        upperThreshold: 1,
        lowerThreshold: 1
      });
      expect(s1.measurements?.length).toBe(6);
      expect(s1.measurements).toMatchObject([{
        createdAt: dates[0][0].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[0][1].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[0][2].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[0][3].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[0][4].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[0][5].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}
      ]);
      expect(s2.stats).toMatchObject({
        startDate: dates[1][0].toISOString().split('.')[0] + 'Z',
        endDate: endDateDate.toISOString().split('.')[0] + 'Z',
        mean: 40,
        variance: 1444,
        upperThreshold: 116,
        lowerThreshold: -36
      });
      expect(s2.measurements?.length).toBe(2);
      expect(s2.measurements).toMatchObject([{
        createdAt: dates[1][0].toISOString().split('.')[0] + 'Z',
        value: 2,
        isOutlier: false}, {
        createdAt: dates[1][1].toISOString().split('.')[0] + 'Z',
        value: 78,
        isOutlier: false}
      ]);
      expect(s3.stats).toMatchObject({
        startDate: date.toISOString().split('.')[0] + 'Z',
        endDate: endDateDate.toISOString().split('.')[0] + 'Z',
        mean: 0.95,
        variance: 0.43,
        upperThreshold: 2.27,
        lowerThreshold: -0.37
      });
      expect(s3.measurements?.length).toBe(4);
      expect(s3.measurements).toMatchObject([{
        createdAt: date.toISOString().split('.')[0] + 'Z',
        value: 0.5,
        isOutlier: false}, {
        createdAt: dates[2][1].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[2][2].toISOString().split('.')[0] + 'Z',
        value: 0.3,
        isOutlier: false}, {
        createdAt: dates[2][3].toISOString().split('.')[0] + 'Z',
        value: 2,
        isOutlier: false}
      ]);
      authorizeSpy.mockRestore();
    });

    /*it("returns 200 OK with measurements, start and end date passed", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const date = new Date("2025-05-29T18:45:00+02:00");
      date.setMilliseconds(0);
      const measurements = new Map();
      const values = [2, 1, 9, 5, 1, 15, 1, 43, 13, 50];
      const dates = [];
      values.forEach((val, idx) => {
        const dateNew = new Date(date.getTime() + 1000*60*10*idx);
        dateNew.setMilliseconds(0);
        dates.push(dateNew)
      });

      values.forEach((val, idx) => {
        measurements.set(dates[idx], val);
      })
      
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        measurements
      );

      const startDate = "2025-05-29T19:00:00+02:00";
      const startDateDate = new Date(startDate);

      const endDate = "2025-05-29T19:40:00+02:00";
      const endDateDate = new Date(endDate);

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.sensorMacAddress).toBe(sensor.macAddress);
      expect(res.body.stats).toMatchObject({
        startDate: startDateDate.toISOString().split('.')[0] + 'Z',
        endDate: endDateDate.toISOString().split('.')[0] + 'Z',
        mean: 7.5,
        variance: 26.75,
        upperThreshold: 17.84,
        lowerThreshold: -2.84
      });
      expect(res.body.measurements?.length).toBe(4);
      expect(res.body.measurements).toMatchObject([{
        createdAt: dates[2].toISOString().split('.')[0] + 'Z',
        value: 9,
        isOutlier: false}, {
        createdAt: dates[3].toISOString().split('.')[0] + 'Z',
        value: 5,
        isOutlier: false}, {
        createdAt: dates[4].toISOString().split('.')[0] + 'Z',
        value: 1,
        isOutlier: false}, {
        createdAt: dates[5].toISOString().split('.')[0] + 'Z',
        value: 15,
        isOutlier: false}
      ]);
      authorizeSpy.mockRestore();
    });

    it("returns 200 OK with measurements, start and end date swapped", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const date = new Date("2025-05-29T18:45:00+02:00");
      date.setMilliseconds(0);
      const measurements = new Map();
      const values = [2, 1, 9, 5, 1, 15, 1, 43, 13, 50];
      const dates = [];
      values.forEach((val, idx) => {
        const dateNew = new Date(date.getTime() + 1000*60*10*idx);
        dateNew.setMilliseconds(0);
        dates.push(dateNew)
      });

      values.forEach((val, idx) => {
        measurements.set(dates[idx], val);
      })
      
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        measurements
      );

      const startDate = "2025-05-29T19:00:00+02:00";
      const endDate = "2025-05-29T19:40:00+02:00";

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements?startDate=${encodeURIComponent(endDate)}&endDate=${encodeURIComponent(startDate)}`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.sensorMacAddress).toBe(sensor.macAddress);
      expect(res.body.stats).toBeUndefined();
      expect(res.body.measurements).toBeUndefined();
      authorizeSpy.mockRestore();
    });

    it("returns 200 OK with measurements, no measurements for sensor", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      
      
      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        new Map()
      );

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/measurements`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.sensorMacAddress).toBe(sensor.macAddress);
      expect(res.body.stats).toBeUndefined();
      expect(res.body.measurements).toBeUndefined();
      authorizeSpy.mockRestore();
    });*/

    it("returns 400 all Bad Requests", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res1 = await request(app)
        .get(`/api/v1/networks/%&*/measurements`)
        .set("Authorization", token);

      expect(res1.status).toBe(400);

      const res4 = await request(app)
        .get(`/api/v1/networks/${network.code}/measurements?startDate=${encodeURIComponent(849)}`)
        .set("Authorization", token);

      expect(res4.status).toBe(400);

      const res5 = await request(app)
        .get(`/api/v1/networks/${network.code}/measurements?endDate=${encodeURIComponent("_*2")}`)
        .set("Authorization", token);

      expect(res5.status).toBe(400);

      const res6 = await request(app)
        .get(`/api/v1/networks/${network.code}/measurements?startDate=${encodeURIComponent("ciao")}&endDate=${encodeURIComponent("pippo")}`)
        .set("Authorization", token);

      expect(res6.status).toBe(400);

      const res7 = await request(app)
        .get(`/api/v1/networks/${network.code}/measurements?sensorMacs=${encodeURIComponent("")}`)
        .set("Authorization", token);

      expect(res7.status).toBe(400);

      authorizeSpy.mockRestore();
    });

    it("returns 404 Not Found error", async () => {
      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res1 = await request(app)
        .get(`/api/v1/networks/NET78/measurements`)
        .set("Authorization", token);

      expect(res1.status).toBe(404);
      expect(res1.body.name).toBe("NotFoundError");
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

    it("forward startDate and endDate as raw ISO strings to getAllStatsOfNetwork controller", async () => {
      const { network } = await setupNetworkGatewaySensor();
      const start = new Date(Date.now() - 15000 * 1000).toISOString();
      const end   = new Date(Date.now() + 15000 * 1000).toISOString();
      const fakeList = [];
      const ctrlSpy = jest
        .spyOn(measurementController, "getAllStatsOfNetwork")
        .mockResolvedValue(fakeList as any);

      jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(
          `/api/v1/networks/${network.code}/stats` +
          `?startDate=${encodeURIComponent(start)}` +
          `&endDate=${encodeURIComponent(end)}`
        )
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(ctrlSpy).toHaveBeenCalledWith(
        network.code,
        undefined,
        start,
        end
      );

      ctrlSpy.mockRestore();
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

    it("forward startDate and endDate as raw ISO strings to getAllOutliersOfNetwork controller", async () => {
      const { network } = await setupNetworkGatewaySensor();
      const start = new Date(Date.now() - 20000 * 1000).toISOString();
      const end   = new Date(Date.now() + 20000 * 1000).toISOString();
      const fakeList = [];
      const ctrlSpy = jest
        .spyOn(measurementController, "getAllOutliersOfNetwork")
        .mockResolvedValue(fakeList as any);

      jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(
          `/api/v1/networks/${network.code}/outliers` +
          `?startDate=${encodeURIComponent(start)}` +
          `&endDate=${encodeURIComponent(end)}`
        )
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(ctrlSpy).toHaveBeenCalledWith(
        network.code,
        undefined,
        start,
        end
      );

      ctrlSpy.mockRestore();
    });
  });
});

