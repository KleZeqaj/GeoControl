import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS, TEST_NETWORKS, TEST_SENSORS } from "@test/e2e/lifecycle";
import { SensorRepository } from "@repositories/SensorRepository";
import { NotFoundError } from "@models/errors/NotFoundError";

describe("GET /networks/{NET}/gateways/{GAT}/sensors (e2e)", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("get all sensors", async () => {
    const res = await request(app)
      .get("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);

    const macAddresses = res.body.map((n: any) => n.macAddress).sort();
    const names = res.body.map((n: any) => n.name).sort();
    const descriptions = res.body.map((n: any) => n.description).sort();
    const units = res.body.map((n: any) => n.unit).sort();
    const variables = res.body.map((n: any) => n.variable).sort();

    expect(macAddresses).toEqual(["DD:DD:DD:DD:DD:DD", "EE:EE:EE:EE:EE:EE", "FF:FF:FF:FF:FF:FF"]);
    expect(names).toEqual(["SENS01", "SENS02", "SENS03"]);
    expect(descriptions).toEqual(["Descrizione SENS01", "Descrizione SENS02", "Descrizione SENS03"]);
    expect(units).toEqual(["C", "F", "K"]);
    expect(variables).toEqual(["temperature", "temperature", "temperature"]);
  });

  it("get all sensors: invalid token", async () => {
    const res1 = await request(app)
      .get("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors")
      .set("Authorization", `Bearer ${generateToken(TEST_USERS.admin)}`);

    expect(res1.status).toBe(200);

    const res2 = await request(app)
      .get("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors")
      .set("Authorization", `Bearer ${generateToken(TEST_USERS.operator)}`);

    expect(res2.status).toBe(200);

    const res3 = await request(app)
      .get("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors")
      .set("Authorization", `Bearer ${generateToken(TEST_USERS.viewer)}`);

    expect(res3.status).toBe(200);

    const res4 = await request(app)
      .get("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors")
      .set("Authorization", `Bearer prova`);

    expect(res4.status).toBe(401);
  });

  it("get all sensors: not found errors", async () => {
    const res1 = await request(app)
      .get("/api/v1/networks/NET05/gateways/AA:AA:AA:AA:AA:AA/sensors")
      .set("Authorization", `Bearer ${token}`);

    expect(res1.status).toBe(404);

    const res2 = await request(app)
      .get("/api/v1/networks/NET01/gateways/11:11:11:11:11:11/sensors")
      .set("Authorization", `Bearer ${generateToken(TEST_USERS.operator)}`);

    expect(res2.status).toBe(404);
  });
});

describe("GET /networks/{NET}/gateways/{GAT}/sensors/{SENS} (e2e)", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("get sensor", async () => {
    const res = await request(app)
      .get("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    expect(res.body.macAddress).toEqual(TEST_SENSORS.sensor1.macAddress);
    expect(res.body.name).toEqual(TEST_SENSORS.sensor1.name);
    expect(res.body.description).toEqual(TEST_SENSORS.sensor1.description);
    expect(res.body.unit).toEqual(TEST_SENSORS.sensor1.unit);
    expect(res.body.variable).toEqual(TEST_SENSORS.sensor1.variable);
  });

  it("get sensor: invalid token", async () => {
    const res1 = await request(app)
      .get("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer ${generateToken(TEST_USERS.admin)}`);

    expect(res1.status).toBe(200);

    const res2 = await request(app)
      .get("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer ${generateToken(TEST_USERS.operator)}`);

    expect(res2.status).toBe(200);

    const res3 = await request(app)
      .get("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer ${generateToken(TEST_USERS.viewer)}`);

    expect(res3.status).toBe(200);

    const res4 = await request(app)
      .get("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer prova`);

    expect(res4.status).toBe(401);
  });

  it("get sensor: not found errors", async () => {
    const res1 = await request(app)
      .get("/api/v1/networks/NET05/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer ${token}`);

    expect(res1.status).toBe(404);

    const res2 = await request(app)
      .get("/api/v1/networks/NET01/gateways/11:11:11:11:11:11/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer ${generateToken(TEST_USERS.operator)}`);

    expect(res2.status).toBe(404);

    const res3 = await request(app)
      .get("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/11:11:11:11:11:11")
      .set("Authorization", `Bearer ${generateToken(TEST_USERS.operator)}`);

    expect(res2.status).toBe(404);
  });
});

describe("POST /networks/{NET}/gateways/{GAT}/sensors (e2e)", () => {
  let tokenAdmin: string;
  let tokenOperator: string;
  let tokenViewer: string;

  beforeAll(async () => {
    await beforeAllE2e();
    tokenAdmin = generateToken(TEST_USERS.admin);
    tokenOperator = generateToken(TEST_USERS.operator);
    tokenViewer = generateToken(TEST_USERS.viewer);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("create sensor", async () => {
    const res = await request(app)
      .post("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        macAddress: "00:11:22:33:44:66",
        name: "TH01",
        description: "External thermometer",
        variable: "temperature",
        unit: "C"
      });

    expect(res.status).toBe(201);

    const sensorRepo = new SensorRepository();
    const result = await sensorRepo.getSensorByMacAddress("00:11:22:33:44:66");
    expect(result).toMatchObject({
        macAddress: "00:11:22:33:44:66",
        name: "TH01",
        description: "External thermometer",
        variable: "temperature",
        unit: "C"
    });

    const res2 = await request(app)
      .post("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors")
      .set("Authorization", `Bearer ${tokenOperator}`)
      .send({
        macAddress: "00:11:22:33:44:55"
      });

    expect(res2.status).toBe(201);

    const result2 = await sensorRepo.getSensorByMacAddress("00:11:22:33:44:55");
    expect(result2).toMatchObject({
        macAddress: "00:11:22:33:44:55",
        name: null,
        description: null,
        variable: null,
        unit: null
    });
  });

  it("create sensor: unauthorized or insufficient rights", async () => {
    const res = await request(app)
      .post("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors")
      .set("Authorization", `Bearer ${tokenViewer}`)
      .send({
        macAddress: "00:11:22:33:44:66",
        name: "TH01",
        description: "External thermometer",
        variable: "temperature",
        unit: "C"
      });

    expect(res.status).toBe(403);

    const res2 = await request(app)
      .post("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors")
      .set("Authorization", `Bearer prova`)
      .send({
        macAddress: "00:11:22:33:44:55"
      });

    expect(res2.status).toBe(401);
  });

  it("create sensor: missing/wrong fields", async () => {
    const res1 = await request(app)
      .post("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        name: "TH01",
        description: "External thermometer",
        variable: "temperature",
        unit: "C"
      });

    expect(res1.status).toBe(400);

    const res2 = await request(app)
      .post("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        macAddress: 1,
        name: "TH01",
        description: "External thermometer",
        variable: "temperature",
        unit: "C"
      });

    expect(res2.status).toBe(400);

    const res3 = await request(app)
      .post("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        macAddress: "11:22:33:44:55:66",
        name: 2,
        description: "External thermometer",
        variable: "temperature",
        unit: "C"
      });

    expect(res3.status).toBe(400);

    const res4 = await request(app)
      .post("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        macAddress: "11:22:33:44:55:66",
        name: "TH01",
        description: 3,
        variable: "temperature",
        unit: "C"
      });

    expect(res4.status).toBe(400);

    const res5 = await request(app)
      .post("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        macAddress: "11:22:33:44:55:66",
        name: "TH01",
        description: "External thermometer",
        variable: 4,
        unit: "C"
      });

    expect(res5.status).toBe(400);

    const res6 = await request(app)
      .post("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        macAddress: "11:22:33:44:55:66",
        name: "TH01",
        description: "External thermometer",
        variable: "temperature",
        unit: 5
      });

    expect(res6.status).toBe(400);
  });

  it("create sensor: not found errors", async () => {
    const res1 = await request(app)
      .post("/api/v1/networks/NET07/gateways/AA:AA:AA:AA:AA:AA/sensors")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        macAddress: "11:22:33:44:55:66",
        name: "TH01",
        description: "External thermometer",
        variable: "temperature",
        unit: "C"
      });

    expect(res1.status).toBe(404);

    const res2 = await request(app)
      .post("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:BB/sensors")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        macAddress: "11:22:33:44:55:66",
        name: "TH01",
        description: "External thermometer",
        variable: "temperature",
        unit: "C"
      });

    expect(res2.status).toBe(404);
  });

  it("create sensor: mac already in use", async () => {
    const res1 = await request(app)
      .post("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        macAddress: "DD:DD:DD:DD:DD:DD",
        name: "TH01",
        description: "External thermometer",
        variable: "temperature",
        unit: "C"
      });

    expect(res1.status).toBe(409);
  });
});

describe("DELETE /networks/{NET}/gateways/{GAT}/sensors/{SENS} (e2e)", () => {
  let tokenAdmin: string;
  let tokenOperator: string;
  let tokenViewer: string;

  beforeAll(async () => {
    await beforeAllE2e();
    tokenAdmin = generateToken(TEST_USERS.admin);
    tokenOperator = generateToken(TEST_USERS.operator);
    tokenViewer = generateToken(TEST_USERS.viewer);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("delete sensor", async () => {
    const sensorRepo = new SensorRepository();
    const result1 = await sensorRepo.getSensorByMacAddress(TEST_SENSORS.sensor1.macAddress);
    expect(result1).toMatchObject({
        macAddress: TEST_SENSORS.sensor1.macAddress,
        name: TEST_SENSORS.sensor1.name,
        description: TEST_SENSORS.sensor1.description,
        variable: TEST_SENSORS.sensor1.variable,
        unit: TEST_SENSORS.sensor1.unit
    });
    const res = await request(app)
      .delete("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer ${tokenAdmin}`)

    expect(res.status).toBe(204);
    await expect(sensorRepo.getSensorByMacAddress(TEST_SENSORS.sensor1.macAddress)).rejects.toThrow(NotFoundError);

    const result2 = await sensorRepo.getSensorByMacAddress(TEST_SENSORS.sensor2.macAddress);
    expect(result2).toMatchObject({
        macAddress: TEST_SENSORS.sensor2.macAddress,
        name: TEST_SENSORS.sensor2.name,
        description: TEST_SENSORS.sensor2.description,
        variable: TEST_SENSORS.sensor2.variable,
        unit: TEST_SENSORS.sensor2.unit
    });
    const res2 = await request(app)
      .delete("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/EE:EE:EE:EE:EE:EE")
      .set("Authorization", `Bearer ${tokenOperator}`)

    expect(res2.status).toBe(204);
    await expect(sensorRepo.getSensorByMacAddress(TEST_SENSORS.sensor2.macAddress)).rejects.toThrow(NotFoundError);
  });

  it("delete sensor: unauthorized or insufficient rights", async () => {
    const res = await request(app)
      .delete("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer ${tokenViewer}`);

    expect(res.status).toBe(403);

    const res2 = await request(app)
      .delete("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer prova`);

    expect(res2.status).toBe(401);
  });

  it("delete sensor: not found errors", async () => {
    const res1 = await request(app)
      .delete("/api/v1/networks/NET07/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res1.status).toBe(404);

    const res2 = await request(app)
      .delete("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:BB/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res2.status).toBe(404);

    const res3 = await request(app)
      .delete("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:EE")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res3.status).toBe(404);
  });
});

describe("PATCH /networks/{NET}/gateways/{GAT}/sensors/{SENS} (e2e)", () => {
  let tokenAdmin: string;
  let tokenOperator: string;
  let tokenViewer: string;

  beforeAll(async () => {
    await beforeAllE2e();
    tokenAdmin = generateToken(TEST_USERS.admin);
    tokenOperator = generateToken(TEST_USERS.operator);
    tokenViewer = generateToken(TEST_USERS.viewer);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("update sensor", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        macAddress: "00:11:22:33:44:66",
        name: "TH01AGG",
        description: "External thermometer AGG",
        unit: "F"
      });

    expect(res.status).toBe(204);

    const sensorRepo = new SensorRepository();
    const result = await sensorRepo.getSensorByMacAddress("00:11:22:33:44:66");
    expect(result).toMatchObject({
        macAddress: "00:11:22:33:44:66",
        name: "TH01AGG",
        description: "External thermometer AGG",
        variable: "temperature",
        unit: "F"
    });

    const res2 = await request(app)
      .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/00:11:22:33:44:66")
      .set("Authorization", `Bearer ${tokenOperator}`)
      .send({
        macAddress: "DD:DD:DD:DD:DD:DD"
      });

    expect(res2.status).toBe(204);

    const result2 = await sensorRepo.getSensorByMacAddress("DD:DD:DD:DD:DD:DD");
    expect(result2).toMatchObject({
        macAddress: "DD:DD:DD:DD:DD:DD",
         name: "TH01AGG",
        description: "External thermometer AGG",
        variable: "temperature",
        unit: "F"
    });
  });

  it("update sensor: unauthorized or insufficient rights", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer ${tokenViewer}`)
      .send({
        macAddress: "00:11:22:33:44:66",
        name: "TH01",
        description: "External thermometer",
        variable: "temperature",
        unit: "C"
      });

    expect(res.status).toBe(403);

    const res2 = await request(app)
      .post("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer prova`)
      .send({
        macAddress: "00:11:22:33:44:55"
      });

    expect(res2.status).toBe(401);
  });

  it("update sensor: missing/wrong fields", async () => {
    const res1 = await request(app)
      .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/EE:EE:EE:EE:EE:EE")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        name: "TH01",
        description: "External thermometer",
        variable: "temperature",
        unit: "C"
      });

    expect(res1.status).toBe(204);

    const res2 = await request(app)
      .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        macAddress: 1,
        name: "TH01",
        description: "External thermometer",
        variable: "temperature",
        unit: "C"
      });

    expect(res2.status).toBe(400);

    const res3 = await request(app)
      .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        macAddress: "11:22:33:44:55:66",
        name: 2,
        description: "External thermometer",
        variable: "temperature",
        unit: "C"
      });

    expect(res3.status).toBe(400);

    const res4 = await request(app)
      .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        macAddress: "11:22:33:44:55:66",
        name: "TH01",
        description: 3,
        variable: "temperature",
        unit: "C"
      });

    expect(res4.status).toBe(400);

    const res5 = await request(app)
      .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        macAddress: "11:22:33:44:55:66",
        name: "TH01",
        description: "External thermometer",
        variable: 4,
        unit: "C"
      });

    expect(res5.status).toBe(400);

    const res6 = await request(app)
      .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        macAddress: "11:22:33:44:55:66",
        name: "TH01",
        description: "External thermometer",
        variable: "temperature",
        unit: 5
      });

    expect(res6.status).toBe(400);
  });

  it("update sensor: not found errors", async () => {
    const res1 = await request(app)
      .patch("/api/v1/networks/NET07/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        macAddress: "11:22:33:44:55:66",
        name: "TH01",
        description: "External thermometer",
        variable: "temperature",
        unit: "C"
      });

    expect(res1.status).toBe(404);

    const res2 = await request(app)
      .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:BB/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        macAddress: "11:22:33:44:55:66",
        name: "TH01",
        description: "External thermometer",
        variable: "temperature",
        unit: "C"
      });

    expect(res2.status).toBe(404);

    const res3 = await request(app)
      .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:BB/sensors/DD:DD:DD:DD:DD:00")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        macAddress: "11:22:33:44:55:66",
        name: "TH01",
        description: "External thermometer",
        variable: "temperature",
        unit: "C"
      });

    expect(res3.status).toBe(404);
  });

  it("update sensor: mac already in use", async () => {
    const res1 = await request(app)
      .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        macAddress: "DD:DD:DD:DD:DD:DD",
        name: "TH01",
        description: "External thermometer",
        variable: "temperature",
        unit: "C"
      });

    expect(res1.status).toBe(204);

    const res2 = await request(app)
      .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        macAddress: "EE:EE:EE:EE:EE:EE",
        name: "TH01",
        description: "External thermometer",
        variable: "temperature",
        unit: "C"
      });

    expect(res2.status).toBe(409);
  });
});