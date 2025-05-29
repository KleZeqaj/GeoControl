import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";
import request from "supertest";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import { MeasurementRepository } from "@repositories/MeasurementRepository";

describe("POST /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements", () => {
  let token: string;
  const networkCode = "NET01";
  const gatewayMac = "AA:AA:AA:AA:AA:AA";
  const sensorMac = "00:11:22:33:44:55";

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);

    // seed a sensor under the existing NET01 / AA:AA:... gateway
    const netRepo = new NetworkRepository();
    const gateRepo = new GatewayRepository();
    const senRepo = new SensorRepository();
    const network = await netRepo.getNetworkByCode(networkCode);
    const gateway = await gateRepo.getGatewayByMacAddress(networkCode, gatewayMac);
    await senRepo.createSensor(sensorMac, gateway, "SENSOR01", "Test sensor", "temperature", "C");
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("201 Created - store measurements (Admin)", async () => {
    const body = [
      { createdAt: new Date().toISOString(), value: 12.5 },
      { createdAt: new Date().toISOString(), value: 13.7 },
    ];
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(201);

    const mRepo = new MeasurementRepository();
    const stored = await mRepo.getAllMeasurementsOfSensor(networkCode, gatewayMac, sensorMac);
    expect(stored.length).toBe(2);
  });

  
  it("401 Unauthorized - missing token", async () => {
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
      .send([{ createdAt: new Date().toISOString(), value: 5 }]);

    expect(res.status).toBe(401);
  });

  it("403 Forbidden - viewer role cannot POST", async () => {
    const viewerToken = generateToken(TEST_USERS.viewer);
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send([{ createdAt: new Date().toISOString(), value: 7 }]);

    expect(res.status).toBe(403);
  });

  it("400 Bad Request - missing fields", async () => {
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
      .set("Authorization", `Bearer ${token}`)
      .send([{ value: 21 }]);  // no createdAt

    expect(res.status).toBe(400);
  });

  it("404 Not Found - invalid network/gateway/sensor", async () => {
    // bad network
    const res1 = await request(app)
      .post(`/api/v1/networks/FAKE/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
      .set("Authorization", `Bearer ${token}`)
      .send([{ createdAt: new Date().toISOString(), value: 1 }]);
    expect(res1.status).toBe(404);

    // bad gateway
    const fakeGateway = "XX:XX:XX:XX:XX:XX";
    const res2 = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${fakeGateway}/sensors/${sensorMac}/measurements`)
      .set("Authorization", `Bearer ${token}`)
      .send([{ createdAt: new Date().toISOString(), value: 1 }]);
    expect(res2.status).toBe(404);

    // bad sensor
  const fakeSensor = "YY:YY:YY:YY:YY:YY";
  const res3 = await request(app)
    .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${fakeSensor}/measurements`)
    .set("Authorization", `Bearer ${token}`)
    .send([{ createdAt: new Date().toISOString(), value: 1 }]);
  expect(res3.status).toBe(404);
  });
});

describe("GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements", () => {
  let token: string;
  const networkCode = "NET01";
  const gatewayMac = "AA:AA:AA:AA:AA:AA";
  const sensorMac = "00:11:22:33:44:55";

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);

    // seed sensor + a couple of measurements
    const netRepo = new NetworkRepository();
    const gateRepo = new GatewayRepository();
    const senRepo = new SensorRepository();
    const mRepo = new MeasurementRepository();

    const network = await netRepo.getNetworkByCode(networkCode);
    const gateway = await gateRepo.getGatewayByMacAddress(networkCode, gatewayMac);
    await senRepo.createSensor(sensorMac, gateway, "SENSOR01", "Test sensor", "humidity", "%");

    await mRepo.storeMeasurements(
      networkCode,
      gatewayMac,
      sensorMac,
      new Map([
        [new Date(Date.now() - 1000 * 60), 30],
        [new Date(), 45],
      ])
    );
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("200 OK - Admin, Operator, Viewer all allowed", async () => {
    for (const user of [TEST_USERS.admin, TEST_USERS.operator, TEST_USERS.viewer]) {
      const tok = generateToken(user);
      const res = await request(app)
        .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
        .set("Authorization", `Bearer ${tok}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.measurements)).toBe(true);
    }
  });

  it("400 Bad Request - invalid startDate format", async () => {
    const res = await request(app)
      .get(
        `/api/v1/networks/${networkCode}` +
        `/gateways/${gatewayMac}` +
        `/sensors/${sensorMac}/measurements` +
        `?startDate=not-a-date`
      )
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/must match format "date-time"/);
  });

  it("400 Bad Request - invalid endDate format", async () => {
    const res = await request(app)
      .get(
        `/api/v1/networks/${networkCode}` +
        `/gateways/${gatewayMac}` +
        `/sensors/${sensorMac}/measurements` +
        `?endDate=12345`
      )
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/must match format "date-time"/);
  });

  it("401 Unauthorized - missing token", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`);
    expect(res.status).toBe(401);
  });

  it("404 Not Found - invalid network/gateway/sensor", async () => {
    // bad network
    const res1 = await request(app)
      .get(`/api/v1/networks/FAKE/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
      .set("Authorization", `Bearer ${token}`);
    expect(res1.status).toBe(404);

    // bad gateway
    const fakeGateway = "XX:XX:XX:XX:XX:XX";
    const res2 = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${fakeGateway}/sensors/${sensorMac}/measurements`)
      .set("Authorization", `Bearer ${token}`);
    expect(res2.status).toBe(404);

    // bad sensor
    const fakeSensor = "YY:YY:YY:YY:YY:YY";
    const res3 = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${fakeGateway}/sensors/${fakeSensor}/measurements`)
      .set("Authorization", `Bearer ${token}`);
    expect(res3.status).toBe(404);
  });
});

describe("GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/stats", () => {
  let token: string;
  const networkCode = "NET01";
  const gatewayMac = "AA:AA:AA:AA:AA:AA";
  const sensorMac = "00:11:22:33:44:55";

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.operator);

    // seed sensor + one measurement
    const netRepo = new NetworkRepository();
    const gateRepo = new GatewayRepository();
    const senRepo = new SensorRepository();
    const mRepo = new MeasurementRepository();

    const network = await netRepo.getNetworkByCode(networkCode);
    const gateway = await gateRepo.getGatewayByMacAddress(networkCode, gatewayMac);
    await senRepo.createSensor(sensorMac, gateway, "SENSOR01", "Test sensor", "pressure", "Pa");

    await mRepo.storeMeasurements(
      networkCode,
      gatewayMac,
      sensorMac,
      new Map([[new Date(), 101.3]])
    );
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("200 OK - compute stats", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/stats`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("mean");
    expect(res.body).toHaveProperty("variance");
  });

  it("401 Unauthorized - missing token", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/stats`);
    expect(res.status).toBe(401);
  });

  it("400 Bad Request - invalid startDate format", async () => {
    const res = await request(app)
      .get(
        `/api/v1/networks/${networkCode}` +
        `/gateways/${gatewayMac}` +
        `/sensors/${sensorMac}/stats` +
        `?startDate=not-a-date`
      )
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/must match format "date-time"/);
  });

  it("400 Bad Request - invalid endDate format", async () => {
    const res = await request(app)
      .get(
        `/api/v1/networks/${networkCode}` +
        `/gateways/${gatewayMac}` +
        `/sensors/${sensorMac}/stats` +
        `?endDate=12345`
      )
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/must match format "date-time"/);
  });

  it("404 Not Found - invalid path params", async () => {
    const res1 = await request(app)
      .get(`/api/v1/networks/FAKE/gateways/${gatewayMac}/sensors/${sensorMac}/stats`)
      .set("Authorization", `Bearer ${token}`);
    expect(res1.status).toBe(404);

    const fakeGatewayMac = "FF:FF:FF:FF:FF:FF";
    const fakeSensorMac  = "EE:EE:EE:EE:EE:EE";
    const res2 = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${fakeGatewayMac}/sensors/${sensorMac}/stats`)
      .set("Authorization", `Bearer ${token}`);
    expect(res2.status).toBe(404);

    const res3 = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${fakeGatewayMac}/sensors/${fakeSensorMac}/stats`)
      .set("Authorization", `Bearer ${token}`);
    expect(res3.status).toBe(404);
  });
});

describe("GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/outliers", () => {
  let token: string;
  const networkCode = "NET01";
  const gatewayMac = "AA:AA:AA:AA:AA:AA";
  const sensorMac = "00:11:22:33:44:55";

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.viewer);

    // seed sensor + some measurements with one outlier
    const netRepo = new NetworkRepository();
    const gateRepo = new GatewayRepository();
    const senRepo = new SensorRepository();
    const mRepo = new MeasurementRepository();

    const network = await netRepo.getNetworkByCode(networkCode);
    const gateway = await gateRepo.getGatewayByMacAddress(networkCode, gatewayMac);
    await senRepo.createSensor(sensorMac, gateway, "SENSOR01", "Test sensor", "voltage", "V");

    const now = Date.now();
    await mRepo.storeMeasurements(
      networkCode,
      gatewayMac,
      sensorMac,
      new Map([
        [new Date(now), 5],
        [new Date(now - 24*3600*1000), 5],
        [new Date(now + 24*3600*1000), 5],
        [new Date(now - 2 * 24*3600*1000), 5],
        [new Date(now - 3 * 24*3600*1000), 5],
        [new Date(now - 4 * 24*3600*1000), 5],
        [new Date(now - 5 * 24*3600*1000), 5],
        [new Date(now - 7 * 24*3600*1000), 5],
        [new Date(now + 6 * 24*3600*1000), 1000],  // outlier
      ])
    );
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("200 OK - retrieve outliers", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/outliers`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.measurements)).toBe(true);
    expect(res.body.measurements.length).toBe(1);
    expect(res.body.measurements[0].value).toBe(1000);
  });

  it("401 Unauthorized - missing token", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/outliers`);
    expect(res.status).toBe(401);
  });

  it("400 Bad Request - invalid startDate format", async () => {
    const res = await request(app)
      .get(
        `/api/v1/networks/${networkCode}` +
        `/gateways/${gatewayMac}` +
        `/sensors/${sensorMac}/outliers` +
        `?startDate=not-a-date`
      )
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/must match format "date-time"/);
  });

  it("400 Bad Request - invalid endDate format", async () => {
    const res = await request(app)
      .get(
        `/api/v1/networks/${networkCode}` +
        `/gateways/${gatewayMac}` +
        `/sensors/${sensorMac}/outliers` +
        `?endDate=12345`
      )
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/must match format "date-time"/);
  });

  it("404 Not Found - invalid params", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/FAKE/gateways/${gatewayMac}/sensors/${sensorMac}/outliers`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe("GET /networks/:networkCode/measurements", () => {
  let token: string;
  const networkCode = "NET01";
  const gatewayMac = "AA:AA:AA:AA:AA:AA";
  const sensorMac = "00:11:22:33:44:55";

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.operator);

    // seed sensor + one measurement
    const netRepo = new NetworkRepository();
    const gateRepo = new GatewayRepository();
    const senRepo = new SensorRepository();
    const mRepo = new MeasurementRepository();

    const network = await netRepo.getNetworkByCode(networkCode);
    const gateway = await gateRepo.getGatewayByMacAddress(networkCode, gatewayMac);
    await senRepo.createSensor(sensorMac, gateway, "SENSOR01", "Test sensor", "current", "A");

    await mRepo.storeMeasurements(
      networkCode,
      gatewayMac,
      sensorMac,
      new Map([[new Date(), 0.1]])
    );
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("200 OK - grouped measurements for network", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/measurements`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("sensorMacAddress");
  });

  it("401 Unauthorized - missing token", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/measurements`);
    expect(res.status).toBe(401);
  });

  it("400 Bad Request - invalid startDate format", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/measurements?startDate=not-a-date`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/must match format "date-time"/);
  });

  it("400 Bad Request - invalid endDate format", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/measurements?endDate=12345`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/must match format "date-time"/);
  });

  it("404 Not Found - invalid network", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/NOPE/measurements`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe("GET /networks/:networkCode/stats", () => {
  let token: string;
  const networkCode = "NET01";
  const gatewayMac = "AA:AA:AA:AA:AA:AA";
  const sensorMac = "00:11:22:33:44:55";

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);

    // seed sensor + one measurement
    const netRepo = new NetworkRepository();
    const gateRepo = new GatewayRepository();
    const senRepo = new SensorRepository();
    const mRepo = new MeasurementRepository();

    const network = await netRepo.getNetworkByCode(networkCode);
    const gateway = await gateRepo.getGatewayByMacAddress(networkCode, gatewayMac);
    await senRepo.createSensor(sensorMac, gateway, "SENSOR01", "Test sensor", "luminosity", "lux");

    await mRepo.storeMeasurements(
      networkCode,
      gatewayMac,
      sensorMac,
      new Map([[new Date(), 300]])
    );
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("200 OK - grouped stats for network", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/stats`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("stats");
  });

  it("401 Unauthorized - missing token", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/stats`);
    expect(res.status).toBe(401);
  });
});

describe("GET /networks/:networkCode/outliers", () => {
  let token: string;
  const networkCode = "NET01";
  const gatewayMac = "AA:AA:AA:AA:AA:AA";
  const sensorMac = "00:11:22:33:44:55";

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.operator);

    // seed sensor + one measurement
    const netRepo = new NetworkRepository();
    const gateRepo = new GatewayRepository();
    const senRepo = new SensorRepository();
    const mRepo = new MeasurementRepository();

    const network = await netRepo.getNetworkByCode(networkCode);
    const gateway = await gateRepo.getGatewayByMacAddress(networkCode, gatewayMac);
    await senRepo.createSensor(sensorMac, gateway, "SENSOR01", "Test sensor", "speed", "m/s");

    await mRepo.storeMeasurements(
      networkCode,
      gatewayMac,
      sensorMac,
      new Map([[new Date(), 7.5]])
    );
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("200 OK - grouped outliers for network", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/outliers`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("401 Unauthorized - missing token", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/outliers`);
    expect(res.status).toBe(401);
  });
});
