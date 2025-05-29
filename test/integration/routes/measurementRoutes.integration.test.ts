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

  // MEGLIO VERIFICARLI IN E2E
  /*it("store measurements: 401 Unauthorized", async () => {
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
  });*/

  describe("GET /measurements for a sensor", () => {
    it("returns 200 OK with measurements, no dates passed", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const date = new Date();
      date.setMilliseconds(0);
      const measurements = new Map();
      const values = [1, 1, 1, 1, 1, 1, 1, 1, 1, 50];
      const dates = [];
      values.forEach((val, idx) => {
        const dateNew = new Date(date.getTime() + 60*10*idx);
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
    /*
    it("forward startDate and endDate as raw ISO strings to getAllStatsOfSensor controller", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const start = new Date(Date.now() - 7200 * 1000).toISOString();
      const end   = new Date(Date.now() + 7200 * 1000).toISOString();
      const fakeStats = { sensorMacAddress: sensor.macAddress, stats: { /* ... * / }, measurements: null };
      const ctrlSpy = jest
        .spyOn(measurementController, "getAllStatsOfSensor")
        .mockResolvedValue(fakeStats as any);

      jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(
          `/api/v1/networks/${network.code}` +
          `/gateways/${gateway.macAddress}` +
          `/sensors/${sensor.macAddress}/stats` +
          `?startDate=${encodeURIComponent(start)}` +
          `&endDate=${encodeURIComponent(end)}`
        )
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(ctrlSpy).toHaveBeenCalledWith(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        start,
        end
      );

      ctrlSpy.mockRestore();
    });
    */
   it("filtra correttamente le statistiche usando startDate e endDate", async () => {
  // 1) preparo rete/gateway/sensore
  const { network, gateway, sensor } = await setupNetworkGatewaySensor();

  // 2) inserisco 3 misure: ieri=10, adesso=20, domani=30
  const now       = Date.now();
  const yesterday = new Date(now - 24*3600*1000);
  const today     = new Date(now);
  const tomorrow  = new Date(now + 24*3600*1000);

  await measurementRepo.storeMeasurements(
    network.code,
    gateway.macAddress,
    sensor.macAddress,
    new Map([
      [yesterday, 10],
      [today,     20],
      [tomorrow,  30],
    ])
  );

  // 3) chiamo la rotta facendogli vedere solo [today, tomorrow]
  const start = new Date(now - 1*3600*1000).toISOString();    // un’ora fa
  const end   = new Date(now + 2*3600*1000).toISOString();    // tra due ore

  const token = "Bearer faketoken";
  jest.spyOn(authService, "processToken").mockResolvedValue(undefined);

  const res = await request(app)
    .get(
      `/api/v1/networks/${network.code}` +
      `/gateways/${gateway.macAddress}` +
      `/sensors/${sensor.macAddress}/stats` +
      `?startDate=${encodeURIComponent(start)}` +
      `&endDate=${encodeURIComponent(end)}`
    )
    .set("Authorization", token);

  expect(res.status).toBe(200);
  expect(res.body.startDate).toBe(start);
  expect(res.body.endDate).toBe(end);

  expect(res.body.mean).toBe(20);
});

  });

  describe("GET /outliers for a sensor", () => {
    it("returns 200 OK with outliers", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
    
      const now = Date.now();
      const map = new Map<Date, number>();
      for (let i = 0; i < 20; i++) {
        map.set(new Date(now + i), 20);
      }
      // outliernon ho risolto '
      map.set(new Date(now + 1000), 1000);

      await measurementRepo.storeMeasurements(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        map 
      );

      const authorizeSpy = jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(`/api/v1/networks/${network.code}/gateways/${gateway.macAddress}/sensors/${sensor.macAddress}/outliers`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.measurements)).toBe(true);
      expect(res.body.measurements.length).toBe(1);
      expect(res.body.measurements[0].value).toBe(1000);
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

    it("forward startDate and endDate as raw ISO strings to getAllOutliersOfSensor controller", async () => {
      const { network, gateway, sensor } = await setupNetworkGatewaySensor();
      const start = new Date(Date.now() - 5000 * 5000).toISOString();
      const end   = new Date(Date.now() + 5000 * 5000).toISOString();

      const fakeOut = {
        sensorMacAddress: sensor.macAddress,
        stats: null,
        measurements: []
      };
      const ctrlSpy = jest
        .spyOn(measurementController, "getAllOutliersOfSensor")
        .mockResolvedValue(fakeOut as any);

    jest.spyOn(authService, "processToken")
        .mockResolvedValue(undefined);

      const res = await request(app)
        .get(
          `/api/v1/networks/${network.code}` +
          `/gateways/${gateway.macAddress}` +
          `/sensors/${sensor.macAddress}/outliers` +
          `?startDate=${encodeURIComponent(start)}` +
          `&endDate=${encodeURIComponent(end)}`
        )
        .set("Authorization", token);
      expect(res.status).toBe(200);
      expect(ctrlSpy).toHaveBeenCalledWith(
        network.code,
        gateway.macAddress,
        sensor.macAddress,
        start,
        end
      );

      ctrlSpy.mockRestore();
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

    it("forward startDate and endDate as raw ISO strings to getAllMeasurementsOfNetwork controller", async () => {
      const { network } = await setupNetworkGatewaySensor();
      const start = new Date(Date.now() - 10000 * 1000).toISOString();
      const end   = new Date(Date.now() + 10000 * 1000).toISOString();
      const fakeList = [];
      const ctrlSpy = jest
        .spyOn(measurementController, "getAllMeasurementsOfNetwork")
        .mockResolvedValue(fakeList as any);

      jest.spyOn(authService, "processToken").mockResolvedValue(undefined);
      const res = await request(app)
        .get(
          `/api/v1/networks/${network.code}/measurements` +
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

