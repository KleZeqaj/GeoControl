import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import {
  beforeAllE2e,
  afterAllE2e,
  TEST_USERS
} from "@test/e2e/acceptance/acceptance-lifecycle";
import * as constants from "@test/e2e/acceptance/constants";
import { NOT_ALLOWED } from "@test/e2e/acceptance/constants";
import { expectOptionalEmptyArray } from "@test/e2e/acceptance/acceptance-utils";

const validPayload = constants.NETWORK1;

const anotherValidPayload = constants.NETWORK2;

const invalidPayload = {
  other_code: 1,
  other_name: "INVALID",
  other_description: "Alpine Weather Monitoring Network",
  another_attribute: []
};
describe("Networks e2e tests", () => {
  describe("GET /networks - role-based access control and validation (e2e)", () => {
    let viewerToken: string;
    let operatorToken: string;
    let adminToken: string;

    beforeAll(async () => {
      await beforeAllE2e();

      viewerToken = generateToken(TEST_USERS.viewer);
      operatorToken = generateToken(TEST_USERS.operator);
      adminToken = generateToken(TEST_USERS.admin);
    });

    afterAll(async () => {
      await afterAllE2e();
    });

    it("should allow a VIEWER to retrieve all networks (200 OK)", async () => {
      const res = await request(app)
        .get("/api/v1/networks")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBe(true);

      res.body.forEach((network: any) => {
        expect(network).toHaveProperty("code");
        expect(network).toHaveProperty("name");
      });
    });

    it("should allow an OPERATOR to retrieve all networks (200 OK)", async () => {
      const res = await request(app)
        .get("/api/v1/networks")
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.status).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBe(true);

      res.body.forEach((network: any) => {
        expect(network).toHaveProperty("code");
        expect(network).toHaveProperty("name");
      });
    });

    it("should allow an ADMIN to retrieve all networks (200 OK)", async () => {
      const res = await request(app)
        .get("/api/v1/networks")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBe(true);

      res.body.forEach((network: any) => {
        expect(network).toHaveProperty("code");
        expect(network).toHaveProperty("name");
      });
    });

    it("should return 401 Unauthorized if NO token is provided", async () => {
      const res = await request(app).get("/api/v1/networks");

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 401 Unauthorized if the token is malformed", async () => {
      const res = await request(app)
        .get("/api/v1/networks")
        .set("Authorization", `Bearer invalid.token.value`);

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });
  });

  describe("GET /networks - role-based access control and validation (e2e) with values", () => {
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
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.NETWORK2);

      await request(app)
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW1);

      await request(app)
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW2);

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

    it("should allow a VIEWER to retrieve all networks (200 OK)", async () => {
      const res = await request(app)
        .get("/api/v1/networks")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);

      const network1 = res.body.find(
        (n: any) => n.code === constants.NETWORK1.code
      );
      const network2 = res.body.find(
        (n: any) => n.code === constants.NETWORK2.code
      );

      expect(network1).toBeDefined();
      expect(Array.isArray(network1.gateways)).toBe(true);
      expect(network1.gateways.length).toBe(2);

      const gw1 = network1.gateways.find(
        (g: any) => g.macAddress === constants.GW1.macAddress
      );
      expect(gw1).toBeDefined();
      expect(Array.isArray(gw1.sensors)).toBe(true);
      expect(gw1.sensors.length).toBe(2);
      for (const sensor of gw1.sensors) {
        expect(sensor).toHaveProperty("macAddress");
      }

      const gw2 = network1.gateways.find(
        (g: any) => g.macAddress === constants.GW2.macAddress
      );
      expect(gw2).toBeDefined();
      expectOptionalEmptyArray(gw2.sensors);

      expect(network2).toBeDefined();
      expectOptionalEmptyArray(network2.gateways);
    });

    it("should allow an OPERATOR to retrieve all networks (200 OK)", async () => {
      const res = await request(app)
        .get("/api/v1/networks")
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);

      const network1 = res.body.find(
        (n: any) => n.code === constants.NETWORK1.code
      );
      const network2 = res.body.find(
        (n: any) => n.code === constants.NETWORK2.code
      );

      expect(network1).toBeDefined();
      expect(Array.isArray(network1.gateways)).toBe(true);
      expect(network1.gateways.length).toBe(2);

      const gw1 = network1.gateways.find(
        (g: any) => g.macAddress === constants.GW1.macAddress
      );
      expect(gw1).toBeDefined();
      expect(Array.isArray(gw1.sensors)).toBe(true);
      expect(gw1.sensors.length).toBe(2);
      for (const sensor of gw1.sensors) {
        expect(sensor).toHaveProperty("macAddress");
      }

      const gw2 = network1.gateways.find(
        (g: any) => g.macAddress === constants.GW2.macAddress
      );
      expect(gw2).toBeDefined();
      expectOptionalEmptyArray(gw2.sensors);

      expect(network2).toBeDefined();
      expectOptionalEmptyArray(network2.gateways);
    });

    it("should allow an ADMIN to retrieve all networks (200 OK)", async () => {
      const res = await request(app)
        .get("/api/v1/networks")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);

      const network1 = res.body.find(
        (n: any) => n.code === constants.NETWORK1.code
      );
      const network2 = res.body.find(
        (n: any) => n.code === constants.NETWORK2.code
      );

      expect(network1).toBeDefined();
      expect(Array.isArray(network1.gateways)).toBe(true);
      expect(network1.gateways.length).toBe(2);

      const gw1 = network1.gateways.find(
        (g: any) => g.macAddress === constants.GW1.macAddress
      );
      expect(gw1).toBeDefined();
      expect(Array.isArray(gw1.sensors)).toBe(true);
      expect(gw1.sensors.length).toBe(2);
      for (const sensor of gw1.sensors) {
        expect(sensor).toHaveProperty("macAddress");
      }

      const gw2 = network1.gateways.find(
        (g: any) => g.macAddress === constants.GW2.macAddress
      );
      expect(gw2).toBeDefined();
      expectOptionalEmptyArray(gw2.sensors);

      expect(network2).toBeDefined();
      expectOptionalEmptyArray(network2.gateways);
    });
  });

  describe("GET /networks/{networkcode} - role-based access control and validation (e2e)", () => {
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
        .send(validPayload);
    });

    afterAll(async () => {
      await afterAllE2e();
    });

    it("should allow a VIEWER to retrieve a network (200 OK)", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${validPayload.code}`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(constants.OK);
      expect(res.body).toMatchObject(validPayload);
    });

    it("should allow an OPERATOR to retrieve a network (200 OK)", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${validPayload.code}`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.status).toBe(constants.OK);
      expect(res.body).toMatchObject(validPayload);
    });

    it("should allow an ADMIN to retrieve a network (200 OK)", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${validPayload.code}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(constants.OK);
      expect(res.body).toMatchObject(validPayload);
    });

    it("should return 401 Unauthorized if NO token is provided", async () => {
      const res = await request(app).get(
        `/api/v1/networks/${validPayload.code}`
      );

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 401 Unauthorized if the token is malformed", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${validPayload.code}`)
        .set("Authorization", `Bearer invalid.token.value`);

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 404 Not Found if the networkCode is not present", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${invalidPayload.other_code}`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });
  });

  describe("POST /networks - role-based and payload validation tests (e2e)", () => {
    let viewertoken: string;
    let operatortoken: string;
    let admintoken: string;

    beforeEach(async () => {
      await beforeAllE2e();
      viewertoken = generateToken(TEST_USERS.viewer);
      operatortoken = generateToken(TEST_USERS.operator);
      admintoken = generateToken(TEST_USERS.admin);
    });

    afterEach(async () => {
      await afterAllE2e();
    });

    it("should allow an OPERATOR to create a network with a valid payload (201 Created)", async () => {
      // Operator attempts to create a new network with correct data
      const res = await request(app)
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${operatortoken}`)
        .send(validPayload);

      expect(res.status).toBe(constants.CREATED);

      // Verify the network was persisted correctly
      const insertedValue = await request(app)
        .get("/api/v1/networks/" + validPayload.code)
        .set("Authorization", `Bearer ${operatortoken}`);

      expect(insertedValue.status).toBe(constants.OK);
      expect(insertedValue.body).toMatchObject(validPayload);
    });

    it("should allow an ADMIN to create a network with a valid payload (201 Created)", async () => {
      const res = await request(app)
        .post("/api/v1/networks/")
        .set("Authorization", `Bearer ${admintoken}`)
        .send(validPayload);

      expect(res.status).toBe(constants.CREATED);
    });

    it("should allow an ADMIN to create a network with a valid payload - actually verifying pre and post conditions (201 Created)", async () => {
      const pre = await request(app)
        .get("/api/v1/networks/" + validPayload.code)
        .set("Authorization", `Bearer ${operatortoken}`);
      expect(pre.statusCode).toBe(constants.NOT_FOUND);

      // Admin creates a network
      const res = await request(app)
        .post("/api/v1/networks/")
        .set("Authorization", `Bearer ${admintoken}`)
        .send(validPayload);

      expect(res.status).toBe(constants.CREATED);

      // Verify the network is retrievable
      const insertedValue = await request(app)
        .get("/api/v1/networks/" + validPayload.code)
        .set("Authorization", `Bearer ${operatortoken}`);

      expect(insertedValue.status).toBe(constants.OK);
      expect(insertedValue.body).toMatchObject(validPayload);
    });

    it("should forbid a VIEWER from creating a network (403 Forbidden)", async () => {
      // Viewer attempts to create a network — not allowed
      const res = await request(app)
        .post("/api/v1/networks/")
        .set("Authorization", `Bearer ${viewertoken}`)
        .send(validPayload);

      expect(res.status).toBe(constants.INSUFFICIENT_RIGHTS);
    });

    it("should reject a request with an INVALID token and VALID payload (401 Unauthorized)", async () => {
      // Invalid token used
      const res = await request(app)
        .post("/api/v1/networks/")
        .set("Authorization", `Bearer invalid.token`)
        .send(validPayload);

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("can return 400 for INVALID payload if a validator enters before the check on the token validity (400 Bad Request, 401 Unathorized)", async () => {
      // Invalid token and malformed payload
      const res = await request(app)
        .post("/api/v1/networks/")
        .set("Authorization", `Bearer invalid.token`)
        .send(invalidPayload);

      const ADMITTED_ERROR = [constants.BAD_REQUEST, constants.UNAUTHORIZED]
      expect(ADMITTED_ERROR).toContain(res.status)
    });

    it("should return 400 for INVALID payload with any valid token (400 Bad Request)", async () => {
      // Admin sends malformed payload
      const res = await request(app)
        .post("/api/v1/networks/")
        .set("Authorization", `Bearer ${admintoken}`)
        .send(invalidPayload);

      expect(res.status).toBe(constants.BAD_REQUEST);
    });

    it("should return 400 when no payload is provided (400 Bad Request)", async () => {
      // Missing request body
      const res = await request(app)
        .post("/api/v1/networks/")
        .set("Authorization", `Bearer ${admintoken}`)
        .set("Content-Type", "application/json");

      expect(res.status).toBe(constants.BAD_REQUEST);
    });

    it("should return 401 when NO token is provided, even with VALID payload (401 Unauthorized)", async () => {
      // Missing authorization header
      const res = await request(app)
        .post("/api/v1/networks/")
        .send(validPayload);

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 401 when NO token is provided and payload is INVALID (401 Unauthorized)", async () => {
      // Missing token and bad payload
      const res = await request(app)
        .post("/api/v1/networks/")
        .send(invalidPayload);

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });
  });

  describe("DELETE /networks/{networkcode} - role-based access control and validation (e2e)", () => {
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
        .send(validPayload);
    });

    afterEach(async () => {
      await afterAllE2e();
    });

    it("should prevent a VIEWER to delete a network (403 OK)", async () => {
      const res = await request(app)
        .delete(`/api/v1/networks/${validPayload.code}`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(constants.INSUFFICIENT_RIGHTS);
      expect(res.body).toMatchObject(constants.OBJECT_INSUFFICIENT_RIGHTS);
    });

    it("should allow an OPERATOR to delete a network (204 DELETED)", async () => {
      const res = await request(app)
        .delete(`/api/v1/networks/${validPayload.code}`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.status).toBe(constants.UPDATED_DELETED);
    });

    it("should allow an ADMIN to delete a network (204 DELETED)", async () => {
      const res = await request(app)
        .delete(`/api/v1/networks/${validPayload.code}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(constants.UPDATED_DELETED);
    });

    it("should allow an ADMIN to delete a network (204 DELETED) - actual check", async () => {
      const pre = await request(app)
        .get(`/api/v1/networks/${validPayload.code}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(pre.statusCode).toBe(constants.OK);
      expect(pre.body).toMatchObject(validPayload);

      const res = await request(app)
        .delete(`/api/v1/networks/${validPayload.code}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(constants.UPDATED_DELETED);

      const post = await request(app)
        .get(`/api/v1/networks/${validPayload.code}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(post.statusCode).toBe(constants.NOT_FOUND);
      expect(post.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should return 401 Unauthorized if NO token is provided", async () => {
      const res = await request(app).delete(
        `/api/v1/networks/${validPayload.code}`
      );

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 401 Unauthorized if the token is malformed", async () => {
      const res = await request(app)
        .delete(`/api/v1/networks/${validPayload.code}`)
        .set("Authorization", `Bearer invalid.token.value`);

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 404 Not Found if the networkCode is not present", async () => {
      const res = await request(app)
        .delete(`/api/v1/networks/${invalidPayload.other_code}`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.status).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should return 405 Method Not Allowed", async () => {
      const res = await request(app)
        .delete(`/api/v1/networks/`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.status).toBe(constants.NOT_ALLOWED);
    });

    it("should allow an OPERATOR to delete a network, checks the successfulness of the deleteion (204 DELETED)", async () => {
      const res1 = await request(app)
        .delete(`/api/v1/networks/${validPayload.code}`)
        .set("Authorization", `Bearer ${operatorToken}`);

      const oldres = await request(app)
        .get(`/api/v1/networks/${validPayload.code}`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(oldres.status).toBe(constants.NOT_FOUND);
    });
  });

  describe("PATCH /networks/{networkcode} - role-based access control and validation (e2e)", () => {
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
        .send(validPayload);
    });

    afterEach(async () => {
      await afterAllE2e();
    });

    it("should allow an OPERATOR to update a network, checks the correctness of the modification (204 UPDATED)", async () => {
      const pre = await request(app)
        .get(`/api/v1/networks/${validPayload.code}`)
        .set("Authorization", `Bearer ${operatorToken}`);
      expect(pre.status).toBe(constants.OK);
      expect(pre.body).toMatchObject(validPayload);

      const res1 = await request(app)
        .patch(`/api/v1/networks/${validPayload.code}`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(anotherValidPayload);

      const oldres = await request(app)
        .get(`/api/v1/networks/${validPayload.code}`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(oldres.status).toBe(constants.NOT_FOUND);

      const newres = await request(app)
        .get(`/api/v1/networks/${anotherValidPayload.code}`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(newres.status).toBe(constants.OK);
      expect(newres.body).toMatchObject(anotherValidPayload);
    });

    it("should prevent a VIEWER to update a network (403 OK)", async () => {
      const res = await request(app)
        .patch(`/api/v1/networks/${validPayload.code}`)
        .set("Authorization", `Bearer ${viewerToken}`)
        .send(anotherValidPayload);

      expect(res.status).toBe(constants.INSUFFICIENT_RIGHTS);
      expect(res.body).toMatchObject(constants.OBJECT_INSUFFICIENT_RIGHTS);
    });

    it("should allow an OPERATOR to update a network (204 UPDATED)", async () => {
      const res = await request(app)
        .patch(`/api/v1/networks/${validPayload.code}`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(anotherValidPayload);

      expect(res.status).toBe(constants.UPDATED_DELETED);
    });

    it("should allow an ADMIN to update a network (204 UPDATED)", async () => {
      const res = await request(app)
        .patch(`/api/v1/networks/${validPayload.code}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(anotherValidPayload);

      expect(res.status).toBe(constants.UPDATED_DELETED);
    });

    it("should return 401 Unauthorized if NO token is provided", async () => {
      const res = await request(app)
        .patch(`/api/v1/networks/${validPayload.code}`)
        .send(anotherValidPayload);

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 401 Unauthorized if the token is malformed", async () => {
      const res = await request(app)
        .patch(`/api/v1/networks/${validPayload.code}`)
        .set("Authorization", `Bearer invalid.token.value`)
        .send(anotherValidPayload);

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 400 Invalid Input if there is no payload", async () => {
      const res = await request(app)
        .patch(`/api/v1/networks/${validPayload.code}`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send({ code: "" });

      expect(res.status).toBe(constants.BAD_REQUEST);
    });

    it("should return 404 Not Found if the networkCode is not present", async () => {
      const res = await request(app)
        .patch(`/api/v1/networks/${invalidPayload.other_code}`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(anotherValidPayload);

      expect(res.status).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should return 405 Method Not Allowed", async () => {
      const res = await request(app)
        .patch(`/api/v1/networks/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(anotherValidPayload);

      expect(res.status).toBe(constants.NOT_ALLOWED);
    });
  });

  describe("PATCH /networks/{networkcode} - Verify the unique constraint in the duplicate identifier checks.", () => {
    let adminToken: string;

    beforeAll(async () => {
      await beforeAllE2e();

      adminToken = generateToken(TEST_USERS.admin);

      await request(app)
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(validPayload);
      await request(app)
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(anotherValidPayload);
    });

    afterAll(async () => {
      await afterAllE2e();
    });

    it("should prevent anyone to update a network with the same ID (409 Conflict Error)", async () => {
      const res = await request(app)
        .patch(`/api/v1/networks/${anotherValidPayload.code}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(validPayload);

      expect(res.status).toBe(constants.CONFLICT);
      expect(res.body).toMatchObject(constants.OBJECT_CONFLICT);
    });
  });

  describe("POST /networks/ - Verify the unique constraint in the duplicate identifier checks.", () => {
    let adminToken: string;

    beforeAll(async () => {
      await beforeAllE2e();

      adminToken = generateToken(TEST_USERS.admin);

      await request(app)
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(validPayload);
    });

    afterAll(async () => {
      await afterAllE2e();
    });

    it("should prevent anyone to add a network with the same ID (409 Conflict Error)", async () => {
      const res = await request(app)
        .post(`/api/v1/networks/`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(validPayload);

      expect(res.status).toBe(constants.CONFLICT);
      expect(res.body).toMatchObject(constants.OBJECT_CONFLICT);
    });
  });

  describe("Verify that consistency of the relations is preserved when altering networkCode", () => {
    let adminToken: string;

    beforeAll(async () => {
      await beforeAllE2e();

      adminToken = generateToken(TEST_USERS.admin);
    });

    afterAll(async () => {
      await afterAllE2e();
    });

    it("should still have gateway and sensor and measurement", async () => {
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
        .patch(`/api/v1/networks/${constants.NETWORK1.code}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.NETWORK2);
      expect(res.statusCode).toBe(constants.UPDATED_DELETED);

      res = await request(app)
        .get("/api/v1/networks/" + constants.NETWORK2.code)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(constants.OK);

      const network = res.body;
      expect(network).toHaveProperty("code");
      expect(network.code).toEqual(constants.NETWORK2.code);
      expect(Array.isArray(network.gateways)).toBe(true);
      expect(network.gateways.length).toBe(1);
      const gateway = network.gateways[0];
      expect(gateway).toHaveProperty("macAddress");
      expect(gateway.macAddress).toEqual(constants.GW1.macAddress);
      expect(Array.isArray(gateway.sensors)).toBe(true);
      expect(gateway.sensors.length).toBe(1);
      const sensor = gateway.sensors[0];
      expect(sensor).toHaveProperty("macAddress");
      expect(sensor.macAddress).toEqual(constants.SENSOR1.macAddress);

      res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK2.code}/measurements`)
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
