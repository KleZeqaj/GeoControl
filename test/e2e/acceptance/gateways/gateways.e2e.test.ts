import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import {
  beforeAllE2e,
  afterAllE2e,
  TEST_USERS
} from "@test/e2e/acceptance/acceptance-lifecycle";
import * as constants from "@test/e2e/acceptance/constants";
import { expectOptionalEmptyArray } from "../acceptance-utils";

describe("Gateway e2e tests", () => {
  describe("GET /networks/:NETWORK1.code/gateways", () => {
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
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW2);
    });

    afterAll(async () => {
      await afterAllE2e();
    });

    it("should retrieve all gateways for a network (viewer)", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/gateways`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBe(true);

      expect(res.body.length).toBe(2);

      for (const gateway of res.body) {
        expect(gateway).toHaveProperty("macAddress");
      }
    });

    it("should retrieve all gateways for a network (operator)", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/gateways`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBe(true);

      expect(res.body.length).toBe(2);

      for (const gateway of res.body) {
        expect(gateway).toHaveProperty("macAddress");
      }
    });

    it("should retrieve all gateways for a network (admin)", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/gateways`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBe(true);

      expect(res.body.length).toBe(2);

      for (const gateway of res.body) {
        expect(gateway).toHaveProperty("macAddress");
      }
    });
  });

  describe("GET /networks/:NETWORK1.code/gateways without gateways", () => {
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
    });

    afterAll(async () => {
      await afterAllE2e();
    });

    it("should retrieve all gateways for a network (viewer)", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/gateways`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBe(true);
      expectOptionalEmptyArray(res.body);
    });

    it("should retrieve all gateways for a network (operator)", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/gateways`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBe(true);
      expectOptionalEmptyArray(res.body);
    });

    it("should retrieve all gateways for a network (admin)", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/gateways`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBe(true);
      expectOptionalEmptyArray(res.body);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/gateways`)
        .set("Authorization", `Bearer invalid.token.value`);

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app).get(
        `/api/v1/networks/${constants.NETWORK1.code}/gateways`
      );

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    /*  TODO: NON RESTITUISCE 404 SE NON TROVA, MA SEMPRE []*/
    it("should return 404 if network not found", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK2}/gateways`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });
  });

  describe("POST /networks/:NETWORK1.code/gateways", () => {
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
    });

    afterEach(async () => {
      await afterAllE2e();
    });

    it("should NOT create a gateway (viewer)", async () => {
      const res = await request(app)
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways`)
        .set("Authorization", `Bearer ${viewerToken}`)
        .send(constants.GW1);

      expect(res.statusCode).toBe(constants.INSUFFICIENT_RIGHTS);
      expect(res.body).toMatchObject(constants.OBJECT_INSUFFICIENT_RIGHTS);
    });

    it("should create a gateway (opertator)", async () => {
      const res = await request(app)
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW1);

      expect(res.statusCode).toBe(constants.CREATED);
    });

    it("should create a gateway (admin)", async () => {
      const res = await request(app)
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.GW1);

      expect(res.statusCode).toBe(constants.CREATED);
    });

    it("should return 400 for missing macAddress", async () => {
      const res = await request(app)
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "GW01" });

      expect(res.statusCode).toBe(constants.BAD_REQUEST);
    });

    it("should return 401 for invalid token", async () => {
      const res = await request(app)
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways`)
        .set("Authorization", `Bearer invalid token`)
        .send(constants.GW1);

      expect(res.statusCode).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 401 for token not provided", async () => {
      const res = await request(app)
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways`)
        .send(constants.GW1);

      expect(res.statusCode).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 404 for network not found", async () => {
      const res = await request(app)
        .post(`/api/v1/networks/${constants.NETWORK2.code}/gateways`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW1);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });
  });

  describe("POST /networks/:NETWORK1.code/gateways - Verify the unique constraint in the duplicate identifier checks.", () => {
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
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW1);
    });

    afterEach(async () => {
      await afterAllE2e();
    });

    it("should return 409 if gateway already exists", async () => {
      const res = await request(app)
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW1);

      expect(res.statusCode).toBe(constants.CONFLICT);
      expect(res.body).toMatchObject(constants.OBJECT_CONFLICT);
    });
  });

  describe("GET /networks/:NETWORK1.code/gateways/:mac", () => {
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

    it("should get a specific gateway (viewer)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(res.body).toMatchObject(constants.GW1);
    });

    it("should get a specific gateway (operator)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(res.body).toMatchObject(constants.GW1);
    });

    it("should get a specific gateway (admin)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(res.body).toMatchObject(constants.GW1);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/gateways`)
        .set("Authorization", `Bearer invalid.token.value`);

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app).get(
        `/api/v1/networks/${constants.NETWORK1.code}/gateways`
      );

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 404 if gateway not found (wrong network code)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW1.macAddress}`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should return 404 if gateway not found (wrong mac address)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW2.macAddress}`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });
  });

  describe("PATCH /networks/:NETWORK1.code/gateways/:mac", () => {
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
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW1);
    });

    afterEach(async () => {
      await afterAllE2e();
    });

    it("should NOT update a gateway (viewer)", async () => {
      const res = await request(app)
        .patch(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}`
        )
        .set("Authorization", `Bearer ${viewerToken}`)
        .send(constants.GW2);

      expect(res.statusCode).toBe(constants.INSUFFICIENT_RIGHTS);
      expect(res.body).toMatchObject(constants.OBJECT_INSUFFICIENT_RIGHTS);
    });

    it("should update a gateway (opertator)", async () => {
      const res = await request(app)
        .patch(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW2);

      expect(res.statusCode).toBe(constants.UPDATED_DELETED);
    });

    it("should update a gateway (admin)", async () => {
      const res = await request(app)
        .patch(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.GW2);

      expect(res.statusCode).toBe(constants.UPDATED_DELETED);
    });

    it("should allow an OPERATOR to update a gateway, checks the correctness of the modification (204 UPDATED)", async () => {
      const res = await request(app)
        .patch(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW2);

      expect(res.statusCode).toBe(constants.UPDATED_DELETED);

      const oldres = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(oldres.status).toBe(constants.NOT_FOUND);

      const newres = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW2.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(newres.status).toBe(constants.OK);
      expect(newres.body).toMatchObject(constants.GW2);
    });

    it("should return 405 for wrong http method", async () => {
      const res = await request(app)
        .patch(`/api/v1/networks/${constants.NETWORK1.code}/gateways`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "GW01" });

      expect(res.statusCode).toBe(constants.NOT_ALLOWED);
    });

    it("should return 401 for invalid token", async () => {
      const res = await request(app)
        .patch(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}`
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
        .patch(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}`
        )
        .send(constants.GW1);

      expect(res.statusCode).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 400 on invalid update payload", async () => {
      const res = await request(app)
        .patch(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send({ name: 123 });

      expect(res.statusCode).toBe(400);
    });

    it("should return 404 for a not found mac address", async () => {
      const res = await request(app)
        .patch(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW2.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.GW2);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should return 404 for a not found network code", async () => {
      const res = await request(app)
        .patch(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.GW2);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });
  });

  describe("PATCH /networks/:NETWORK1.code/gateways/:mac - Verify the unique constraint in the duplicate identifier checks.", () => {
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
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW1);

      await request(app)
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW2);
    });

    afterAll(async () => {
      await afterAllE2e();
    });

    it("should prevent anyone to update a gateway with the same mac address (409 Conflict Error)", async () => {
      const res = await request(app)
        .patch(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.GW2);

      expect(res.status).toBe(constants.CONFLICT);
      expect(res.body).toMatchObject(constants.OBJECT_CONFLICT);
    });
  });

  describe("DELETE /networks/:NETWORK1.code/gateways/:mac", () => {
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
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW1);
    });

    afterEach(async () => {
      await afterAllE2e();
    });

    it("should NOT delete a gateway (viewer)", async () => {
      const res = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.INSUFFICIENT_RIGHTS);
      expect(res.body).toMatchObject(constants.OBJECT_INSUFFICIENT_RIGHTS);
    });

    it("should delete a gateway (opertator)", async () => {
      const res = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(constants.UPDATED_DELETED);
    });

    it("should delete a gateway (admin)", async () => {
      const res = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(constants.UPDATED_DELETED);
    });

    it("should allow an OPERATOR to delete a gateway, checks the correctness of the deleteion (204 DELETED)", async () => {
      const pre = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(pre.statusCode).toBe(constants.OK);

      const res = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(constants.UPDATED_DELETED);

      const oldres = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(oldres.statusCode).toBe(constants.NOT_FOUND);
    });

    it("should return 401 for invalid token", async () => {
      const res = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}`
        )
        .set("Authorization", `Bearer invalid token`);

      expect(res.statusCode).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 401 for token not provided", async () => {
      const res = await request(app).delete(
        `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}`
      );

      expect(res.statusCode).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 404 for a not found mac address", async () => {
      const res = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW2.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should return 404 for a not found network code", async () => {
      const res = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });
  });

  describe("Verify that consistency of the relations is preserved when altering gateway mac Address", () => {
    let adminToken: string;

    beforeAll(async () => {
      await beforeAllE2e();

      adminToken = generateToken(TEST_USERS.admin);
    });

    afterAll(async () => {
      await afterAllE2e();
    });

    it("should still be in network and have sensor and measurement", async () => {
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
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.GW2);
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
      expect(gateway.macAddress).toEqual(constants.GW2.macAddress);
      expect(Array.isArray(gateway.sensors)).toBe(true);
      expect(gateway.sensors.length).toBe(1);
      const sensor = gateway.sensors[0];
      expect(sensor).toHaveProperty("macAddress");
      expect(sensor.macAddress).toEqual(constants.SENSOR1.macAddress);

      res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/measurements`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);

      let measure = res.body[0];
      expect(measure).toHaveProperty("sensorMacAddress");
      expect(measure).toHaveProperty("measurements");
      expect(measure.sensorMacAddress).toEqual(constants.SENSOR1.macAddress);
      expect(Array.isArray(measure.measurements)).toBe(true);
      expect(measure.measurements.length).toBe(1);
    });
  });
});
