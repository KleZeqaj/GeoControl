import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import {
  beforeAllE2e,
  afterAllE2e,
  TEST_USERS
} from "@test/e2e/acceptance/acceptance-lifecycle";
import * as constants from "@test/e2e/acceptance/constants";

describe("Sensors e2e tests", () => {
  describe("GET /networks/:NETWORK1.code/gateways/:GW1.macAddress/sensors with sensors", () => {
    let viewerToken: string;
    let operatorToken: string;
    let adminToken: string;

    beforeAll(async () => {
      await beforeAllE2e();

      viewerToken = generateToken(TEST_USERS.viewer);
      operatorToken = generateToken(TEST_USERS.operator);
      adminToken = generateToken(TEST_USERS.admin);

      await request(app)
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.NETWORK1);

      await request(app)
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW1);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR1);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR2);
    });

    afterAll(async () => {
      await afterAllE2e();
    });

    it("should retrieve all sensors for a gateway (viewer)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBe(true);

      expect(res.body.length).toBe(2);

      for (const sensor of res.body) {
        expect(sensor).toHaveProperty("macAddress");
      }
    });

    it("should retrieve all sensors for a gateway (operator)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBe(true);

      expect(res.body.length).toBe(2);

      for (const sensor of res.body) {
        expect(sensor).toHaveProperty("macAddress");
      }
    });

    it("should retrieve all sensors for a gateway (admin)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBe(true);

      expect(res.body.length).toBe(2);

      for (const sensor of res.body) {
        expect(sensor).toHaveProperty("macAddress");
      }
    });
  });

  describe("GET /networks/:NETWORK1.code/gateways/:GW1.macAddress/sensors", () => {
    let viewerToken: string;
    let operatorToken: string;
    let adminToken: string;

    beforeAll(async () => {
      await beforeAllE2e();

      viewerToken = generateToken(TEST_USERS.viewer);
      operatorToken = generateToken(TEST_USERS.operator);
      adminToken = generateToken(TEST_USERS.admin);

      await request(app)
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.NETWORK1);

      await request(app)
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW1);
    });

    afterAll(async () => {
      await afterAllE2e();
    });

    it("should retrieve all sensors for a gateway (viewer)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBe(true);

      res.body.forEach((sensor: any) => {
        expect(sensor).toHaveProperty("macAddress");
      });
    });

    it("should retrieve all sensors for a gateway (operator)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBe(true);

      res.body.forEach((sensor: any) => {
        expect(sensor).toHaveProperty("macAddress");
      });
    });

    it("should retrieve all sensors for a gateway (admin)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBe(true);

      res.body.forEach((sensor: any) => {
        expect(sensor).toHaveProperty("macAddress");
      });
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors`
        )
        .set("Authorization", `Bearer invalid.token.value`);

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app).get(
        `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors`
      );

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    /*  TODO: NON RESTITUISCE 404 SE NON TROVA, MA SEMPRE []*/
    it("should return 404 if network not found", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK2}/gateways/${constants.GW1.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should return 404 if gateway not found", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1}/gateways/${constants.GW2.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });
  });

  describe("GET /networks/:NETWORK1.code/gateways/:GW1.macAddress/sensors/:macAddress", () => {
    let viewerToken: string;
    let operatorToken: string;
    let adminToken: string;

    beforeAll(async () => {
      await beforeAllE2e();

      viewerToken = generateToken(TEST_USERS.viewer);
      operatorToken = generateToken(TEST_USERS.operator);
      adminToken = generateToken(TEST_USERS.admin);

      await request(app)
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.NETWORK1);

      await request(app)
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW1);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR1);
    });

    afterAll(async () => {
      await afterAllE2e();
    });

    it("should get a specific sensor (viewer)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(res.body).toMatchObject(constants.SENSOR1);
    });

    it("should get a specific sensor (operator)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(res.body).toMatchObject(constants.SENSOR1);
    });

    it("should get a specific sensor (admin)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(res.body).toMatchObject(constants.SENSOR1);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer invalid.token.value`);

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app).get(
        `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
      );

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 404 if gateway not found (wrong network code)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should return 404 if gateway not found (wrong mac address)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW2.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should return 404 if gateway not found (wrong mac address)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR2.macAddress}`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });
  });

  describe("POST /networks/:NETWORK1.code/gateways/:GW1.macAddress/sensors", () => {
    let viewerToken: string;
    let operatorToken: string;
    let adminToken: string;

    beforeEach(async () => {
      await beforeAllE2e();

      viewerToken = generateToken(TEST_USERS.viewer);
      operatorToken = generateToken(TEST_USERS.operator);
      adminToken = generateToken(TEST_USERS.admin);

      await request(app)
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.NETWORK1);

      await request(app)
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW1);
    });

    afterEach(async () => {
      await afterAllE2e();
    });

    it("should NOT create a sensor (viewer)", async () => {
      const res = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${viewerToken}`)
        .send(constants.SENSOR1);

      expect(res.statusCode).toBe(constants.INSUFFICIENT_RIGHTS);
      expect(res.body).toMatchObject(constants.OBJECT_INSUFFICIENT_RIGHTS);
    });

    it("should create a gateway (opertator)", async () => {
      const res = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR1);

      expect(res.statusCode).toBe(constants.CREATED);
    });

    it("should create a gateway (admin)", async () => {
      const res = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.SENSOR1);

      expect(res.statusCode).toBe(constants.CREATED);
    });

    it("should create a gateway - actually verifies that it is created", async () => {
      const res = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.SENSOR1);

      expect(res.statusCode).toBe(constants.CREATED);

      const get = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(get.statusCode).toBe(constants.OK);
      expect(get.body).toMatchObject(constants.SENSOR1);
    });

    it("should return 400 for missing macAddress", async () => {
      const res = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Sensor01" });

      expect(res.statusCode).toBe(constants.BAD_REQUEST);
    });

    it("should return 401 for invalid token", async () => {
      const res = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer invalid token`)
        .send(constants.SENSOR1);

      expect(res.statusCode).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 401 for token not provided", async () => {
      const res = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .send(constants.SENSOR1);

      expect(res.statusCode).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should 404 for network not found", async () => {
      const res = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.SENSOR1);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should 404 for gateway not found", async () => {
      const res = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW2.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.SENSOR1);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });
  });

  describe("POST /networks/:NETWORK1.code/gateways/:GW1.macAddress/sensors - Verify the unique constraint in the duplicate identifier checks.", () => {
    let viewerToken: string;
    let operatorToken: string;
    let adminToken: string;

    beforeEach(async () => {
      await beforeAllE2e();

      viewerToken = generateToken(TEST_USERS.viewer);
      operatorToken = generateToken(TEST_USERS.operator);
      adminToken = generateToken(TEST_USERS.admin);

      await request(app)
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.NETWORK1);

      await request(app)
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW1);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR1);
    });

    afterEach(async () => {
      await afterAllE2e();
    });

    it("should return 409 if the sensor already exists", async () => {
      const res = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR1);

      expect(res.statusCode).toBe(constants.CONFLICT);
      expect(res.body).toMatchObject(constants.OBJECT_CONFLICT);
    });
  });

  describe("DELETE /networks/:NETWORK1.code/gateways/:GW1.macAddress/sensors/:SENSOR1.macAddress", () => {
    let viewerToken: string;
    let operatorToken: string;
    let adminToken: string;

    beforeEach(async () => {
      await beforeAllE2e();

      viewerToken = generateToken(TEST_USERS.viewer);
      operatorToken = generateToken(TEST_USERS.operator);
      adminToken = generateToken(TEST_USERS.admin);

      await request(app)
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.NETWORK1);

      await request(app)
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW1);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR1);
    });

    afterEach(async () => {
      await afterAllE2e();
    });

    it("should NOT delete a sensor (viewer)", async () => {
      const res = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.INSUFFICIENT_RIGHTS);
      expect(res.body).toMatchObject(constants.OBJECT_INSUFFICIENT_RIGHTS);
    });

    it("should delete a sensor (opertator)", async () => {
      const res = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(constants.UPDATED_DELETED);
    });

    it("should delete a sensor (admin)", async () => {
      const res = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(constants.UPDATED_DELETED);
    });

    it("should delete a gateway (admin) - actually verify that is deleted", async () => {
      const pre = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(pre.statusCode).toBe(constants.OK);
      expect(pre.body).toMatchObject(constants.SENSOR1);

      const res = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(constants.UPDATED_DELETED);

      const post = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(post.statusCode).toBe(constants.NOT_FOUND);
      expect(post.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should return 404 for sensor macAddress not found", async () => {
      const res = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR2.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should return 404 for gateway macAddress not found", async () => {
      const res = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW2.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should return 404 for network code not found", async () => {
      const res = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should return 401 for invalid token", async () => {
      const res = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer invalid token`)
        .send(constants.GW1);

      expect(res.statusCode).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 401 for token not provided", async () => {
      const res = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .send(constants.GW1);

      expect(res.statusCode).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 405 for wrong http mehtod", async () => {
      const res = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.SENSOR1);

      expect(res.statusCode).toBe(constants.NOT_ALLOWED);
    });
  });

  describe("PATCH /networks/:NETWORK1.code/gateways/:GW1.macAddress/sensors", () => {
    let viewerToken: string;
    let operatorToken: string;
    let adminToken: string;

    beforeEach(async () => {
      await beforeAllE2e();

      viewerToken = generateToken(TEST_USERS.viewer);
      operatorToken = generateToken(TEST_USERS.operator);
      adminToken = generateToken(TEST_USERS.admin);

      await request(app)
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.NETWORK1);

      await request(app)
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW1);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR1);
    });

    afterEach(async () => {
      await afterAllE2e();
    });

    it("should NOT update a sensor (viewer)", async () => {
      const res = await request(app)
        .patch(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${viewerToken}`)
        .send(constants.SENSOR2);

      expect(res.statusCode).toBe(constants.INSUFFICIENT_RIGHTS);
      expect(res.body).toMatchObject(constants.OBJECT_INSUFFICIENT_RIGHTS);
    });

    it("should update a sensor (opertator)", async () => {
      const res = await request(app)
        .patch(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR2);

      expect(res.statusCode).toBe(constants.UPDATED_DELETED);
    });

    it("should update a sensor (admin)", async () => {
      const res = await request(app)
        .patch(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.SENSOR2);

      expect(res.statusCode).toBe(constants.UPDATED_DELETED);
    });

    it("should update a sensor (admin) - actually checks that is updated", async () => {
      const pre = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(pre.statusCode).toBe(constants.OK);
      expect(pre.body).toMatchObject(constants.SENSOR1);

      const res = await request(app)
        .patch(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.SENSOR2);

      expect(res.statusCode).toBe(constants.UPDATED_DELETED);

      const post = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR2.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(post.statusCode).toBe(constants.OK);
      expect(post.body).toMatchObject(constants.SENSOR2);

      const post2 = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(post2.statusCode).toBe(constants.NOT_FOUND);
    });

    it("should return 400 for missing macAddress", async () => {
      const res = await request(app)
        .patch(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ macAddress: "" });

      expect(res.statusCode).toBe(constants.BAD_REQUEST);
    });

    it("should return 401 for invalid token", async () => {
      const res = await request(app)
        .patch(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer invalid token`)
        .send(constants.SENSOR2);

      expect(res.statusCode).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 401 for token not provided", async () => {
      const res = await request(app)
        .patch(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .send(constants.SENSOR2);

      expect(res.statusCode).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should 404 for network not found", async () => {
      const res = await request(app)
        .patch(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.SENSOR2);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should 404 for gateway not found", async () => {
      const res = await request(app)
        .patch(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW2.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.SENSOR2);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should 404 for sensor not found", async () => {
      const res = await request(app)
        .patch(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW2.macAddress}/sensors/${constants.SENSOR2.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.SENSOR1);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should return 405 for wrong http mehtod", async () => {
      const res = await request(app)
        .patch(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.SENSOR1);

      expect(res.statusCode).toBe(constants.NOT_ALLOWED);
    });
  });

  describe("PATCH /networks/:NETWORK1.code/gateways/:GW1.macAddress/sensors - Verify the unique constraint in the duplicate identifier checks.", () => {
    let viewerToken: string;
    let operatorToken: string;
    let adminToken: string;

    beforeEach(async () => {
      await beforeAllE2e();

      viewerToken = generateToken(TEST_USERS.viewer);
      operatorToken = generateToken(TEST_USERS.operator);
      adminToken = generateToken(TEST_USERS.admin);

      await request(app)
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.NETWORK1);

      await request(app)
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW1);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR1);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR2);
    });

    afterEach(async () => {
      await afterAllE2e();
    });

    it("should return 409 if the sensor already exists", async () => {
      const res = await request(app)
        .patch(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR2.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR1);

      expect(res.statusCode).toBe(constants.CONFLICT);
      expect(res.body).toMatchObject(constants.OBJECT_CONFLICT);
    });
  });

  describe("Verify that consistency of the relations is preserved when altering sensor mac Address", () => {
    let adminToken: string;

    beforeAll(async () => {
      await beforeAllE2e();

      adminToken = generateToken(TEST_USERS.admin);
    });

    afterAll(async () => {
      await afterAllE2e();
    });

    it("should still be in gateway and have measurement", async () => {
      let res = await request(app)
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.NETWORK1);
      expect(res.status).toBe(constants.CREATED);

      res = await request(app)
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.GW1);
      expect(res.statusCode).toBe(constants.CREATED);

      res = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.SENSOR1);
      expect(res.statusCode).toBe(constants.CREATED);

      res = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send([constants.MEASURE1]);
      expect(res.statusCode).toBe(constants.CREATED);

      res = await request(app)
        .patch(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.SENSOR2);
      expect(res.statusCode).toBe(constants.UPDATED_DELETED);

      res = await request(app)
        .get("/api/v1/networks/" + constants.NETWORK1.code)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(constants.OK);

      const network = res.body;
      expect(network).toHaveProperty("code");
      expect(network.code).toEqual(constants.NETWORK1.code);
      expect(Array.isArray(network.gateways)).toBe(true);
      expect(network.gateways.length).toBe(1);
      const gateway = network.gateways[0];
      expect(gateway).toHaveProperty("macAddress");
      expect(gateway.macAddress).toEqual(constants.GW1.macAddress);
      expect(Array.isArray(gateway.sensors)).toBe(true);
      expect(gateway.sensors.length).toBe(1);
      const sensor = gateway.sensors[0];
      expect(sensor).toHaveProperty("macAddress");
      expect(sensor.macAddress).toEqual(constants.SENSOR2.macAddress);

      res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/measurements`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);

      let measure = res.body[0];
      expect(measure).toHaveProperty("sensorMacAddress");
      expect(measure).toHaveProperty("measurements");
      expect(measure.sensorMacAddress).toEqual(constants.SENSOR2.macAddress);
      expect(Array.isArray(measure.measurements)).toBe(true);
      expect(measure.measurements.length).toBe(1);
    });
  });
});
