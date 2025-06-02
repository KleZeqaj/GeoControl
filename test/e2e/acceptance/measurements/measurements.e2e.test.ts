import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import {
  beforeAllE2e,
  afterAllE2e,
  TEST_USERS
} from "@test/e2e/acceptance/acceptance-lifecycle";
import * as constants from "@test/e2e/acceptance/constants";
import { response } from "express";
import { expectOptionalEmptyArray } from "@test/e2e/acceptance/acceptance-utils";

describe("Measurements e2e tests", () => {
  function isIsoUtcString(dateStr: string): boolean {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(dateStr);
  }

  function roundToSeconds(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }

  describe("POST /networks/:NETWORK1.code/gateways/:GW1.macAddress/sensors/constants.SENSOR1.macAddress/measurements", () => {
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

    it("should store three measurements and convert them to UTC", async () => {
      let res = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send(constants.DIFFERENT_TIMEZONE_MEASUREMENTS);

      expect(res.statusCode).toBe(constants.CREATED);

      let get = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/measurements`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(get.statusCode).toBe(constants.OK);
      expect(Array.isArray(get.body)).toBeTruthy();
      expect(get.body.length).toBe(1);

      let measures = get.body;
      measures.forEach((measure) => {
        expect(measure).toHaveProperty("sensorMacAddress");
        expect(measure).toHaveProperty("measurements");
        expect(Array.isArray(measure.measurements)).toBe(true);
        expect(measure.measurements.length).toBe(
          constants.DIFFERENT_TIMEZONE_MEASUREMENTS.length
        );
        let list = measure.measurements;

        const expectedTimestamps = constants.UTC_MEASUREMENTS_STRING_ARRAY.map(
          (d) => new Date(d).getTime()
        );

        for (const m of list) {
          expect(m).toHaveProperty("createdAt");
          expect(isIsoUtcString(m.createdAt)).toBeTruthy();

          const actualTimestamp = new Date(m.createdAt).getTime();
          expect(expectedTimestamps.includes(actualTimestamp)).toBeTruthy();
        }
      });
    });

    it("should NOT create a measure (viewer)", async () => {
      const res = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements/`
        )
        .set("Authorization", `Bearer ${viewerToken}`)
        .send([constants.MEASURE1]);

      expect(res.statusCode).toBe(constants.INSUFFICIENT_RIGHTS);
      expect(res.body).toMatchObject(constants.OBJECT_INSUFFICIENT_RIGHTS);
    });

    it("should create a measure (admin)", async () => {
      const res = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send([constants.MEASURE1]);

      expect(res.statusCode).toBe(constants.CREATED);
    });

    it("should create a measure (operator)", async () => {
      const res = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send([constants.MEASURE1]);

      expect(res.statusCode).toBe(constants.CREATED);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer invalid.token.value`)
        .send([constants.MEASURE1]);

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .send([constants.MEASURE1]);

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 404 if network not found", async () => {
      const res = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send([constants.MEASURE1]);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should return 404 if gateway not found", async () => {
      const res = await request(app)
        .post(
          `/api/v1/networks/---/gateways/${constants.GW2.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send([constants.MEASURE1]);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should return 404 if sensor not found", async () => {
      const res = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR2.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send([constants.MEASURE1]);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });
  });

  describe("GET /networks/:NETWORK1.code/gateways/:GW1.macAddress/sensors/constants.SENSOR1.macAddress/measurements", () => {
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
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR1);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send([constants.MEASURE1, constants.MEASURE2]);
    });

    afterAll(async () => {
      await afterAllE2e();
    });

    it("should retrieve all measurements of a sensor (viewer)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(res.body).toHaveProperty("sensorMacAddress");
      expect(res.body).toHaveProperty("measurements");
      expect(Array.isArray(res.body.measurements)).toBe(true);
      expect(res.body.measurements.length).toBe(2);

      for (const measure of res.body.measurements) {
        expect(measure).toHaveProperty("createdAt");
        expect(isIsoUtcString(measure.createdAt)).toBeTruthy();
      }
    });

    it("should retrieve all measurements of a sensor (operator)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(res.body).toHaveProperty("sensorMacAddress");
      expect(res.body).toHaveProperty("measurements");
      expect(Array.isArray(res.body.measurements)).toBe(true);
      expect(res.body.measurements.length).toBe(2);

      for (const measure of res.body.measurements) {
        expect(measure).toHaveProperty("createdAt");
        expect(isIsoUtcString(measure.createdAt)).toBeTruthy();
      }
    });

    it("should retrieve all measurements of a sensor (admin)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(res.body).toHaveProperty("sensorMacAddress");
      expect(res.body).toHaveProperty("measurements");
      expect(Array.isArray(res.body.measurements)).toBe(true);
      expect(res.body.measurements.length).toBe(2);

      for (const measure of res.body.measurements) {
        expect(measure).toHaveProperty("createdAt");
        expect(isIsoUtcString(measure.createdAt)).toBeTruthy();
      }
    });

    it("should return all the measurements if the date range is containing them", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${viewerToken}`)
        .query({
          startDate: "2025-02-18T19:50:00+04:00",
          endDate: "2025-02-18T20:20:00+04:00"
        });

      expect(res.statusCode).toBe(constants.OK);
      expect(res.body).toHaveProperty("stats");
      expect(res.body.stats).toHaveProperty("startDate");
      expect(res.body.stats).toHaveProperty("endDate");
      expect(isIsoUtcString(res.body.stats.startDate)).toBeTruthy();
      expect(isIsoUtcString(res.body.stats.endDate)).toBeTruthy();
      expect(res.body).toHaveProperty("sensorMacAddress");
      expect(res.body).toHaveProperty("measurements");
      expect(Array.isArray(res.body.measurements)).toBe(true);
      expect(res.body.measurements.length).toBe(2);

      for (const measure of res.body.measurements) {
        expect(measure).toHaveProperty("createdAt");
        expect(isIsoUtcString(measure.createdAt)).toBeTruthy();
      }
    });

    it("should return only the measurements included in the date range if containing them", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${viewerToken}`)
        .query({
          startDate: "2025-02-18T20:05:00+04:00",
          endDate: "2025-02-18T20:15:00+04:00"
        });

      expect(res.statusCode).toBe(constants.OK);
      expect(res.body).toHaveProperty("stats");
      expect(res.body.stats).toHaveProperty("startDate");
      expect(res.body.stats).toHaveProperty("endDate");
      expect(isIsoUtcString(res.body.stats.startDate)).toBeTruthy();
      expect(isIsoUtcString(res.body.stats.endDate)).toBeTruthy();
      expect(res.body).toHaveProperty("sensorMacAddress");
      expect(res.body).toHaveProperty("measurements");
      expect(Array.isArray(res.body.measurements)).toBe(true);
      expect(res.body.measurements.length).toBe(1);

      for (const measure of res.body.measurements) {
        expect(measure).toHaveProperty("createdAt");
        expect(isIsoUtcString(measure.createdAt)).toBeTruthy();
      }
    });

    it("should return NO measurements if the date range is not containing measurements", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${viewerToken}`)
        .query({
          startDate: "2025-01-18T19:50:00+04:00",
          endDate: "2025-01-18T20:20:00+04:00"
        });

      expect(res.statusCode).toBe(constants.OK);
      expect(res.body).toHaveProperty("sensorMacAddress");
      expect(res.body).toHaveProperty("stats");
      expect(res.body.stats).toHaveProperty("startDate");
      expect(res.body.stats).toHaveProperty("endDate");
      expect(isIsoUtcString(res.body.stats.startDate)).toBeTruthy();
      expect(isIsoUtcString(res.body.stats.endDate)).toBeTruthy();
      expectOptionalEmptyArray(res.body.measurements);
    });

    it("should provide an empty array of measurements if the two dates are inverted ", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${viewerToken}`)
        .query({
          startDate: "2025-02-18T20:20:00+04:00",
          endDate: "2025-02-18T19:50:00+04:00"
        });

      expect(res.statusCode).toBe(constants.OK);
      expect(res.body).toHaveProperty("sensorMacAddress");
      expect(res.body).toHaveProperty("stats");
      expect(res.body.stats).toHaveProperty("startDate");
      expect(res.body.stats).toHaveProperty("endDate");
      expect(isIsoUtcString(res.body.stats.startDate)).toBeTruthy();
      expect(isIsoUtcString(res.body.stats.endDate)).toBeTruthy();
      expectOptionalEmptyArray(res.body.measurements);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer invalid.token.value`);

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app).get(
        `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
      );

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 404 if network not found", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should return 404 if gateway not found", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW2.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should return 404 if sensor not found", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR2.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });
  });

  describe("GET /networks/:NETWORK1.code/gateways/:GW1.macAddress/sensors/constants.SENSOR1.macAddress/stats", () => {
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
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR1);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send([constants.MEASURE1, constants.MEASURE2]);
    });

    afterAll(async () => {
      await afterAllE2e();
    });

    it("should retrieve all statistic of a sensor (viewer)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/stats`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(res.body).toHaveProperty("mean");
      expect(res.body).toHaveProperty("variance");
      expect(res.body).toHaveProperty("upperThreshold");
      expect(res.body).toHaveProperty("lowerThreshold");
      //expect(Array.isArray(res.body)).toBe(true);

      expect(res.body.mean).toBeCloseTo(constants.MEAN_VALUE);
      expect(res.body.variance).toBeCloseTo(constants.VARIANCE_VALUE);

      if (res.body.hasOwnProperty("startDate"))
        expect(isIsoUtcString(res.body.startDate)).toBeTruthy();
      if (res.body.hasOwnProperty("endDate"))
        expect(isIsoUtcString(res.body.endDate)).toBeTruthy();
    });

    it("should retrieve all measurements of a sensor (operator)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/stats`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(res.body).toHaveProperty("mean");
      expect(res.body).toHaveProperty("variance");
      expect(res.body).toHaveProperty("upperThreshold");
      expect(res.body).toHaveProperty("lowerThreshold");

      expect(res.body.mean).toBeCloseTo(constants.MEAN_VALUE);
      expect(res.body.variance).toBeCloseTo(constants.VARIANCE_VALUE);
      if (res.body.hasOwnProperty("startDate"))
        expect(isIsoUtcString(res.body.startDate)).toBeTruthy();
      if (res.body.hasOwnProperty("endDate"))
        expect(isIsoUtcString(res.body.endDate)).toBeTruthy();
    });

    it("should retrieve all measurements of a sensor (admin)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/stats`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(res.body).toHaveProperty("mean");
      expect(res.body).toHaveProperty("variance");
      expect(res.body).toHaveProperty("upperThreshold");
      expect(res.body).toHaveProperty("lowerThreshold");
      //expect(Array.isArray(res.body)).toBe(true);

      expect(res.body.mean).toBeCloseTo(constants.MEAN_VALUE);
      expect(res.body.variance).toBeCloseTo(constants.VARIANCE_VALUE);

      if (res.body.hasOwnProperty("startDate"))
        expect(isIsoUtcString(res.body.startDate)).toBeTruthy();
      if (res.body.hasOwnProperty("endDate"))
        expect(isIsoUtcString(res.body.endDate)).toBeTruthy();
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/stats`
        )
        .set("Authorization", `Bearer invalid.token.value`);

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app).get(
        `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/stats`
      );

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 404 if network not found", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/stats`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should return 404 if gateway not found", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW2.macAddress}/sensors/${constants.SENSOR1.macAddress}/stats`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should return 404 if sensor not found", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR2.macAddress}/stats`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });
  });

  describe("GET /networks/:NETWORK1.code/gateways/:GW1.macAddress/sensors/constants.SENSOR1.macAddress/outliers", () => {
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
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR1);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.OUTLIER_ARRAY);
    });

    afterAll(async () => {
      await afterAllE2e();
    });

    it("should retrieve all the outlier of a sensor (viewer)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/outliers`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(res.body).toHaveProperty("sensorMacAddress");
      expect(res.body.sensorMacAddress).toStrictEqual(
        constants.SENSOR1.macAddress
      );

      if (res.body.hasOwnProperty("measurements")) {
        let measurements = res.body.measurements;
        for (let i = 0; i < measurements.length; i++) {
          expect(measurements[i]).toHaveProperty("createdAt");
          expect(measurements[i]).toHaveProperty("value");
          expect(measurements[i]).toHaveProperty("isOutlier");
          expect(measurements[i].isOutlier).toBeTruthy();
        }
      }
    });

    it("should retrieve all the outlier of a sensor (operator)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/outliers`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(res.body).toHaveProperty("sensorMacAddress");
      expect(res.body.sensorMacAddress).toStrictEqual(
        constants.SENSOR1.macAddress
      );

      if (res.body.hasOwnProperty("measurements")) {
        let measurements = res.body.measurements;
        for (let i = 0; i < measurements.length; i++) {
          expect(measurements[i]).toHaveProperty("createdAt");
          expect(measurements[i]).toHaveProperty("value");
          expect(measurements[i]).toHaveProperty("isOutlier");
          expect(measurements[i].isOutlier).toBeTruthy();
        }
      }
    });

    it("should retrieve all the outlier of a sensor (admin)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/outliers`
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(res.body).toHaveProperty("sensorMacAddress");
      expect(res.body.sensorMacAddress).toStrictEqual(
        constants.SENSOR1.macAddress
      );

      if (res.body.hasOwnProperty("measurements")) {
        let measurements = res.body.measurements;
        for (let i = 0; i < measurements.length; i++) {
          expect(measurements[i]).toHaveProperty("createdAt");
          expect(measurements[i]).toHaveProperty("value");
          expect(measurements[i]).toHaveProperty("isOutlier");
          expect(measurements[i].isOutlier).toBeTruthy();
        }
      }
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/outliers`
        )
        .set("Authorization", `Bearer invalid.token.value`);

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app).get(
        `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/outliers`
      );

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 404 if network not found", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/outliers`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should return 404 if gateway not found", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW2.macAddress}/sensors/${constants.SENSOR1.macAddress}/outliers`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });

    it("should return 404 if sensor not found", async () => {
      const res = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR2.macAddress}/outliers`
        )
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });
  });

  describe("GET /networks/:NETWORK1.code/measurements", () => {
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
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR1);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send([constants.MEASURE1, constants.MEASURE2]);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR2);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR2.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send([constants.MEASURE1, constants.MEASURE2]);

      await request(app)
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.NETWORK2);

      await request(app)
        .post(`/api/v1/networks/${constants.NETWORK2.code}/gateways/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW2);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR3);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors/${constants.SENSOR3.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.OUTLIER_ARRAY);
    });

    afterAll(async () => {
      await afterAllE2e();
    });

    it("should retrieve all measurements of a network (viewer)", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK2.code}/measurements`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);

      let measures = res.body;
      measures.forEach((measure) => {
        expect(measure).toHaveProperty("sensorMacAddress");
        expect(measure).toHaveProperty("measurements");
        expect(Array.isArray(measure.measurements)).toBe(true);
        expect(measure.measurements.length).toBe(
          constants.OUTLIER_ARRAY.length
        );
        let list = measure.measurements;
        for (const m of list) {
          expect(m).toHaveProperty("createdAt");
          expect(isIsoUtcString(m.createdAt)).toBeTruthy();
        }
      });
    });

    it("should retrieve all measurements of a network (operator)", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK2.code}/measurements`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);

      let measures = res.body;
      measures.forEach((measure) => {
        expect(measure).toHaveProperty("sensorMacAddress");
        expect(measure).toHaveProperty("measurements");
        expect(Array.isArray(measure.measurements)).toBe(true);
        expect(measure.measurements.length).toBe(
          constants.OUTLIER_ARRAY.length
        );
        let list = measure.measurements;
        for (const m of list) {
          expect(m).toHaveProperty("createdAt");
          expect(isIsoUtcString(m.createdAt)).toBeTruthy();
        }
      });
    });

    it("should retrieve all measurements of a network (admin)", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK2.code}/measurements`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);

      let measures = res.body;
      measures.forEach((measure) => {
        expect(measure).toHaveProperty("sensorMacAddress");
        expect(measure).toHaveProperty("measurements");
        expect(Array.isArray(measure.measurements)).toBe(true);
        expect(measure.measurements.length).toBe(
          constants.OUTLIER_ARRAY.length
        );
        let list = measure.measurements;
        for (const m of list) {
          expect(m).toHaveProperty("createdAt");
          expect(isIsoUtcString(m.createdAt)).toBeTruthy();
        }
      });
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK2.code}/measurements`)
        .set("Authorization", `Bearer invalid.token.value`);

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app).get(
        `/api/v1/networks/${constants.NETWORK2.code}/measurements`
      );

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 404 if network not found", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/notANetworkCode/measurements`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });
  });

  describe("GET /networks/:NETWORK1.code/stats", () => {
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
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR1);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send([constants.MEASURE1, constants.MEASURE2]);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR2);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR2.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send([constants.MEASURE1, constants.MEASURE2]);

      await request(app)
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.NETWORK2);

      await request(app)
        .post(`/api/v1/networks/${constants.NETWORK2.code}/gateways/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW2);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR3);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors/${constants.SENSOR3.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.OUTLIER_ARRAY);
    });

    afterAll(async () => {
      await afterAllE2e();
    });

    it("should retrieve all statistic of a network (viewer)", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/stats`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBeTruthy();
      let measures = res.body;
      measures.forEach((measure) => {
        expect(measure).toHaveProperty("sensorMacAddress");
        expect(measure).toHaveProperty("stats");
        let stat = measure.stats;
        expect(stat).toHaveProperty("variance");
        expect(stat).toHaveProperty("upperThreshold");
        expect(stat).toHaveProperty("lowerThreshold");

        expect(stat.mean).toBeCloseTo(constants.MEAN_VALUE);
        expect(stat.variance).toBeCloseTo(constants.VARIANCE_VALUE);
      });
    });

    it("should retrieve all measurements of a network (operator)", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/stats`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBeTruthy();
      let measures = res.body;
      measures.forEach((measure) => {
        expect(measure).toHaveProperty("sensorMacAddress");
        expect(measure).toHaveProperty("stats");
        let stat = measure.stats;
        expect(stat).toHaveProperty("variance");
        expect(stat).toHaveProperty("upperThreshold");
        expect(stat).toHaveProperty("lowerThreshold");

        expect(stat.mean).toBeCloseTo(constants.MEAN_VALUE);
        expect(stat.variance).toBeCloseTo(constants.VARIANCE_VALUE);
      });
    });

    it("should retrieve all measurements of a network (admin)", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/stats`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBeTruthy();
      let measures = res.body;
      measures.forEach((measure) => {
        expect(measure).toHaveProperty("sensorMacAddress");
        expect(measure).toHaveProperty("stats");
        let stat = measure.stats;
        expect(stat).toHaveProperty("variance");
        expect(stat).toHaveProperty("upperThreshold");
        expect(stat).toHaveProperty("lowerThreshold");

        expect(stat.mean).toBeCloseTo(constants.MEAN_VALUE);
        expect(stat.variance).toBeCloseTo(constants.VARIANCE_VALUE);
      });
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/stats`)
        .set("Authorization", `Bearer invalid.token.value`);

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app).get(
        `/api/v1/networks/${constants.NETWORK1.code}/stats`
      );

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 404 if network not found", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/notAnId/stats`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });
  });

  describe("GET /networks/:NETWORK1.code/outliers", () => {
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
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR1);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send([constants.MEASURE1, constants.MEASURE2]);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR2);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR2.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send([constants.MEASURE1, constants.MEASURE2]);

      await request(app)
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.NETWORK2);

      await request(app)
        .post(`/api/v1/networks/${constants.NETWORK2.code}/gateways/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW2);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR3);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors/${constants.SENSOR3.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.OUTLIER_ARRAY);
    });

    afterAll(async () => {
      await afterAllE2e();
    });

    it("should retrieve all the outlier of a network (viewer)", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK2.code}/outliers`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBeTruthy();
      let measures = res.body;
      measures.forEach((measure) => {
        expect(measure).toHaveProperty("sensorMacAddress");
        expect(measure.sensorMacAddress).toStrictEqual(
          constants.SENSOR3.macAddress
        );

        if (measure.hasOwnProperty("measurements")) {
          let measurements = measure.measurements;
          for (let i = 0; i < measurements.length; i++) {
            expect(measurements[i]).toHaveProperty("createdAt");
            expect(measurements[i]).toHaveProperty("value");
            expect(measurements[i]).toHaveProperty("isOutlier");
            expect(measurements[i].isOutlier).toBeTruthy();
          }
        }
      });
    });

    it("should retrieve all the outlier of a network (operator)", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK2.code}/outliers`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBeTruthy();
      let measures = res.body;
      measures.forEach((measure) => {
        expect(measure).toHaveProperty("sensorMacAddress");
        expect(measure.sensorMacAddress).toStrictEqual(
          constants.SENSOR3.macAddress
        );

        if (measure.hasOwnProperty("measurements")) {
          let measurements = measure.measurements;
          for (let i = 0; i < measurements.length; i++) {
            expect(measurements[i]).toHaveProperty("createdAt");
            expect(measurements[i]).toHaveProperty("value");
            expect(measurements[i]).toHaveProperty("isOutlier");
            expect(measurements[i].isOutlier).toBeTruthy();
          }
        }
      });
    });

    it("should retrieve all the outlier of a network (admin)", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK2.code}/outliers`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(constants.OK);
      expect(Array.isArray(res.body)).toBeTruthy();
      let measures = res.body;
      measures.forEach((measure) => {
        expect(measure).toHaveProperty("sensorMacAddress");
        expect(measure.sensorMacAddress).toStrictEqual(
          constants.SENSOR3.macAddress
        );

        if (measure.hasOwnProperty("measurements")) {
          let measurements = measure.measurements;
          for (let i = 0; i < measurements.length; i++) {
            expect(measurements[i]).toHaveProperty("createdAt");
            expect(measurements[i]).toHaveProperty("value");
            expect(measurements[i]).toHaveProperty("isOutlier");
            expect(measurements[i].isOutlier).toBeTruthy();
          }
        }
      });
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK2.code}/outliers`)
        .set("Authorization", `Bearer invalid.token.value`);

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app).get(
        `/api/v1/networks/${constants.NETWORK2.code}/outliers`
      );

      expect(res.status).toBe(constants.UNAUTHORIZED);
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("name");
      expect(res.body.name).toMatch(/unauthorized/i);
    });

    it("should return 404 if network not found", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/NOT-A-NETWORK-CODE/outliers`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(constants.NOT_FOUND);
      expect(res.body).toMatchObject(constants.OBJECT_NOT_FOUND);
    });
  });

  describe("Verify cascading operations", () => {
    let viewerToken;
    let operatorToken;
    let adminToken;

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
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR1);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send([constants.MEASURE1, constants.MEASURE2]);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR2);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR2.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send([constants.MEASURE1, constants.MEASURE2]);

      await request(app)
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.NETWORK2);

      await request(app)
        .post(`/api/v1/networks/${constants.NETWORK2.code}/gateways/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW2);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR3);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors/${constants.SENSOR3.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.OUTLIER_ARRAY);
    });

    afterEach(async () => {
      await afterAllE2e();
    });

    it("should not provide measurements if the sensor is deleted", async () => {
      let del = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(del.statusCode).toBe(constants.UPDATED_DELETED);

      let getSens = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getSens.statusCode).toBe(constants.NOT_FOUND);

      let getNet = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/measurements`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getNet.statusCode).toBe(constants.OK);
      expect(Array.isArray(getNet.body)).toBeTruthy();
      expect(getNet.body.length).toBe(1);

      let measures = getNet.body;
      measures.forEach((measure) => {
        expect(measure).toHaveProperty("sensorMacAddress");
        expect(measure.sensorMacAddress).toStrictEqual(
          constants.SENSOR2.macAddress
        );
        expect(measure).toHaveProperty("measurements");
        expect(Array.isArray(measure.measurements)).toBe(true);
      });
    });

    it("should not provide measurements if the gateway is deleted", async () => {
      let del = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(del.statusCode).toBe(constants.UPDATED_DELETED);

      let getSens = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getSens.statusCode).toBe(constants.NOT_FOUND);

      getSens = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getSens.statusCode).toBe(constants.NOT_FOUND);

      let getNet = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/measurements`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getNet.statusCode).toBe(constants.OK);
      expect(Array.isArray(getNet.body)).toBeTruthy();
      expect(getNet.body.length == 0).toBeTruthy();
    });

    it("should not provide measurements if the network is deleted", async () => {
      let del = await request(app)
        .delete(`/api/v1/networks/${constants.NETWORK1.code}/`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(del.statusCode).toBe(constants.UPDATED_DELETED);

      let getSens = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getSens.statusCode).toBe(constants.NOT_FOUND);

      getSens = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getSens.statusCode).toBe(constants.NOT_FOUND);

      getSens = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getSens.statusCode).toBe(constants.NOT_FOUND);

      let getNet = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/measurements`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getNet.statusCode).toBe(constants.NOT_FOUND);
    });

    it("should not provide outliers if the sensor is deleted", async () => {
      let del = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(del.statusCode).toBe(constants.UPDATED_DELETED);

      let getSens = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/outliers`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getSens.statusCode).toBe(constants.NOT_FOUND);

      let getNet = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/outliers`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getNet.statusCode).toBe(constants.OK);
      expect(Array.isArray(getNet.body)).toBeTruthy();
      expect(getNet.body.length).toBe(1);

      let measures = getNet.body;
      measures.forEach((measure) => {
        expect(measure).toHaveProperty("sensorMacAddress");
        expect(measure.sensorMacAddress).toStrictEqual(
          constants.SENSOR2.macAddress
        );
      });
    });

    it("should not provide outliers if the gateway is deleted", async () => {
      let del = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(del.statusCode).toBe(constants.UPDATED_DELETED);

      let getSens = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/outliers`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getSens.statusCode).toBe(constants.NOT_FOUND);

      let getNet = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/outliers`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getNet.statusCode).toBe(constants.OK);
      expect(Array.isArray(getNet.body)).toBeTruthy();
      expect(getNet.body.length == 0).toBeTruthy();
    });

    it("should not provide outliers if the network is deleted", async () => {
      let del = await request(app)
        .delete(`/api/v1/networks/${constants.NETWORK1.code}/`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(del.statusCode).toBe(constants.UPDATED_DELETED);

      let getSens = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/outliers`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getSens.statusCode).toBe(constants.NOT_FOUND);

      let getNet = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/outliers`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getNet.statusCode).toBe(constants.NOT_FOUND);
    });

    it("should not provide stats if the sensor is deleted", async () => {
      let del = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(del.statusCode).toBe(constants.UPDATED_DELETED);

      let getSens = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/stats`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getSens.statusCode).toBe(constants.NOT_FOUND);

      let getNet = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/stats`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getNet.statusCode).toBe(constants.OK);
      expect(Array.isArray(getNet.body)).toBeTruthy();
      expect(getNet.body.length).toBe(1);

      let measures = getNet.body;
      measures.forEach((measure) => {
        expect(measure).toHaveProperty("sensorMacAddress");
        expect(measure.sensorMacAddress).toStrictEqual(
          constants.SENSOR2.macAddress
        );
      });
    });

    it("should not provide stats if the gateway is deleted", async () => {
      let del = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(del.statusCode).toBe(constants.UPDATED_DELETED);

      let getSens = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/stats`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getSens.statusCode).toBe(constants.NOT_FOUND);

      let getNet = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/stats`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getNet.statusCode).toBe(constants.OK);
      expect(Array.isArray(getNet.body)).toBeTruthy();
      expect(getNet.body.length == 0).toBeTruthy();
    });

    it("should not provide stats if the network is deleted", async () => {
      let del = await request(app)
        .delete(`/api/v1/networks/${constants.NETWORK1.code}/`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(del.statusCode).toBe(constants.UPDATED_DELETED);

      let getSens = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/stats`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getSens.statusCode).toBe(constants.NOT_FOUND);

      let getNet = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/stats`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getNet.statusCode).toBe(constants.NOT_FOUND);
    });

    it("should not provide measurements if the sensor is deleted and readded with the same code", async () => {
      let del = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(del.statusCode).toBe(constants.UPDATED_DELETED);

      let post = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR1);

      expect(post.statusCode).toBe(constants.CREATED);

      let getSens = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getSens.statusCode).toBe(constants.OK);
      if (getSens.body.hasOwnProperty("measurements")) {
        expect(getSens.body.measurements.length == 0).toBeTruthy();
      }

      let getNet = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/measurements`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getNet.statusCode).toBe(constants.OK);
      expect(Array.isArray(getNet.body)).toBeTruthy();

      let measures = getNet.body;
      measures.forEach((measure) => {
        expect(measure).toHaveProperty("sensorMacAddress");
        if (measure.sensorMacAddress === constants.SENSOR1.macAddress) {
          if (measure.hasOwnProperty("measurements"))
            expect(measure.measurements.length == 0).toBeTruthy();
        } else {
          expect(measure).toHaveProperty("measurements");
          expect(Array.isArray(measure.measurements)).toBeTruthy();
        }
      });
    });

    it("should not provide measurements if the gateway is deleted and readded with the same code", async () => {
      let del = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(del.statusCode).toBe(constants.UPDATED_DELETED);

      let post = await request(app)
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW1);

      expect(post.statusCode).toBe(constants.CREATED);

      post = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR1);

      expect(post.statusCode).toBe(constants.CREATED);

      let getSens = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getSens.statusCode).toBe(constants.OK);
      if (getSens.body.hasOwnProperty("measurements")) {
        expect(getSens.body.measurements.length == 0).toBeTruthy();
      }

      let getNet = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/measurements`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getNet.statusCode).toBe(constants.OK);
      expect(Array.isArray(getNet.body)).toBeTruthy();

      let measures = getNet.body;
      measures.forEach((measure) => {
        expect(measure).toHaveProperty("sensorMacAddress");
        if (measure.sensorMacAddress === constants.SENSOR1.macAddress) {
          if (measure.hasOwnProperty("measurements"))
            expect(measure.measurements.length == 0).toBeTruthy();
        } else {
          expect(measure).toHaveProperty("measurements");
          expect(Array.isArray(measure.measurements)).toBeTruthy();
        }
      });
    });

    it("should not provide measurements if the network is deleted and readded with the same code", async () => {
      let del = await request(app)
        .delete(`/api/v1/networks/${constants.NETWORK1.code}/`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(del.statusCode).toBe(constants.UPDATED_DELETED);

      let post = await request(app)
        .post(`/api/v1/networks/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.NETWORK1);

      expect(post.statusCode).toBe(constants.CREATED);

      post = await request(app)
        .post(`/api/v1/networks/${constants.NETWORK1.code}/gateways/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW1);

      expect(post.statusCode).toBe(constants.CREATED);

      post = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR1);

      expect(post.statusCode).toBe(constants.CREATED);

      let getSens = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getSens.statusCode).toBe(constants.OK);
      if (getSens.body.hasOwnProperty("measurements")) {
        expect(getSens.body.measurements.length == 0).toBeTruthy();
      }

      let getNet = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/measurements`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getNet.statusCode).toBe(constants.OK);
      expect(Array.isArray(getNet.body)).toBeTruthy();

      let measures = getNet.body;
      measures.forEach((measure) => {
        expect(measure).toHaveProperty("sensorMacAddress");
        if (measure.sensorMacAddress === constants.SENSOR1.macAddress) {
          if (measure.hasOwnProperty("measurements"))
            expect(measure.measurements.length == 0).toBeTruthy();
        } else {
          expect(measure).toHaveProperty("measurements");
          expect(Array.isArray(measure.measurements)).toBeTruthy();
        }
      });
    });

    it("should not provide outliers if the sensor is deleted and readded with the same code", async () => {
      let del = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors/${constants.SENSOR3.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(del.statusCode).toBe(constants.UPDATED_DELETED);

      let post = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR3);

      expect(post.statusCode).toBe(constants.CREATED);

      let getSens = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors/${constants.SENSOR3.macAddress}/outliers`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getSens.statusCode).toBe(constants.OK);
      if (getSens.body.hasOwnProperty("measurements")) {
        expect(getSens.body.measurements.length == 0).toBeTruthy();
      }

      let getNet = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK2.code}/outliers`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getNet.statusCode).toBe(constants.OK);
      expect(Array.isArray(getNet.body)).toBeTruthy();
      if (getNet.body[0].hasOwnProperty("measurements"))
        expect(getNet.body[0].measurements.length == 0).toBeTruthy();
    });

    it("should not provide outliers if the gateway is deleted and readded with the same code", async () => {
      let del = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(del.statusCode).toBe(constants.UPDATED_DELETED);

      let post = await request(app)
        .post(`/api/v1/networks/${constants.NETWORK2.code}/gateways/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW2);

      expect(post.statusCode).toBe(constants.CREATED);

      post = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR3);

      expect(post.statusCode).toBe(constants.CREATED);

      let getSens = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors/${constants.SENSOR3.macAddress}/outliers`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getSens.statusCode).toBe(constants.OK);
      if (getSens.body.hasOwnProperty("measurements")) {
        expect(getSens.body.measurements.length == 0).toBeTruthy();
      }

      let getNet = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK2.code}/outliers`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getNet.statusCode).toBe(constants.OK);
      expect(Array.isArray(getNet.body)).toBeTruthy();
      if (getNet.body[0].hasOwnProperty("measurements"))
        expect(getNet.body[0].measurements.length == 0).toBeTruthy();
    });

    it("should not provide outliers if the network is deleted and readded with the same code", async () => {
      let del = await request(app)
        .delete(`/api/v1/networks/${constants.NETWORK2.code}/`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(del.statusCode).toBe(constants.UPDATED_DELETED);

      let post = await request(app)
        .post(`/api/v1/networks/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.NETWORK2);

      expect(post.statusCode).toBe(constants.CREATED);

      post = await request(app)
        .post(`/api/v1/networks/${constants.NETWORK2.code}/gateways/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW2);

      expect(post.statusCode).toBe(constants.CREATED);

      post = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR3);

      expect(post.statusCode).toBe(constants.CREATED);

      let getSens = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/outliers`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getSens.statusCode).toBe(constants.OK);
      if (getSens.body.hasOwnProperty("measurements")) {
        expect(getSens.body.measurements.length == 0).toBeTruthy();
      }

      let getNet = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/outliers`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getNet.statusCode).toBe(constants.OK);
      expect(Array.isArray(getNet.body)).toBeTruthy();
      if (getNet.body[0].hasOwnProperty("measurements"))
        expect(getNet.body[0].measurements.length == 0).toBeTruthy();
    });

    it("should not provide stats if the sensor is deleted and readded with the same code", async () => {
      let del = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors/${constants.SENSOR3.macAddress}`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(del.statusCode).toBe(constants.UPDATED_DELETED);
      let post = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR3);

      expect(post.statusCode).toBe(constants.CREATED);

      let getSens = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors/${constants.SENSOR3.macAddress}/stats`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      let body1 = getSens.body;
      expect(getSens.statusCode).toBe(constants.OK);
      expect(body1).toHaveProperty("mean");
      expect(body1).toHaveProperty("variance");
      expect(body1).toHaveProperty("upperThreshold");
      expect(body1).toHaveProperty("lowerThreshold");

      expect(body1.mean).toBeCloseTo(0);
      expect(body1.variance).toBeCloseTo(0);
      expect(body1.upperThreshold).toBeCloseTo(0);
      expect(body1.lowerThreshold).toBeCloseTo(0);

      let getNet = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK2.code}/stats`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getNet.statusCode).toBe(constants.OK);
      expect(Array.isArray(getNet.body)).toBeTruthy();
      expect(getNet.body.length).toBe(1);

      let measures = getNet.body;
      measures.forEach((measure) => {
        if (measure.hasOwnProperty("stats")) {
          expect(measure.stats).toHaveProperty("mean");
          expect(measure.stats).toHaveProperty("variance");
          expect(measure.stats).toHaveProperty("upperThreshold");
          expect(measure.stats).toHaveProperty("lowerThreshold");

          expect(measure.stats.mean).toBeCloseTo(0);
          expect(measure.stats.variance).toBeCloseTo(0);
          expect(measure.stats.upperThreshold).toBeCloseTo(0);
          expect(measure.stats.lowerThreshold).toBeCloseTo(0);
        }
      });
    });

    it("should not provide stats if the gateway is deleted and readded with the same code", async () => {
      let del = await request(app)
        .delete(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(del.statusCode).toBe(constants.UPDATED_DELETED);

      let post = await request(app)
        .post(`/api/v1/networks/${constants.NETWORK2.code}/gateways/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW2);

      expect(post.statusCode).toBe(constants.CREATED);

      post = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR3);

      expect(post.statusCode).toBe(constants.CREATED);

      let getSens = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors/${constants.SENSOR3.macAddress}/stats`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      let body1 = getSens.body;
      expect(getSens.statusCode).toBe(constants.OK);
      expect(body1).toHaveProperty("mean");
      expect(body1).toHaveProperty("variance");
      expect(body1).toHaveProperty("upperThreshold");
      expect(body1).toHaveProperty("lowerThreshold");

      expect(body1.mean).toBeCloseTo(0);
      expect(body1.variance).toBeCloseTo(0);
      expect(body1.upperThreshold).toBeCloseTo(0);
      expect(body1.lowerThreshold).toBeCloseTo(0);

      let getNet = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK2.code}/stats`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getNet.statusCode).toBe(constants.OK);
      expect(Array.isArray(getNet.body)).toBeTruthy();
      expect(getNet.body.length).toBe(1);

      let measures = getNet.body;
      measures.forEach((measure) => {
        if (measure.hasOwnProperty("stats")) {
          expect(measure.stats).toHaveProperty("mean");
          expect(measure.stats).toHaveProperty("variance");
          expect(measure.stats).toHaveProperty("upperThreshold");
          expect(measure.stats).toHaveProperty("lowerThreshold");

          expect(measure.stats.mean).toBeCloseTo(0);
          expect(measure.stats.variance).toBeCloseTo(0);
          expect(measure.stats.upperThreshold).toBeCloseTo(0);
          expect(measure.stats.lowerThreshold).toBeCloseTo(0);
        }
      });
    });

    it("should not provide stats if the network is deleted and readded with the same code", async () => {
      let del = await request(app)
        .delete(`/api/v1/networks/${constants.NETWORK2.code}/`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(del.statusCode).toBe(constants.UPDATED_DELETED);

      let post = await request(app)
        .post(`/api/v1/networks/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.NETWORK2);

      expect(post.statusCode).toBe(constants.CREATED);

      post = await request(app)
        .post(`/api/v1/networks/${constants.NETWORK2.code}/gateways/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW2);

      expect(post.statusCode).toBe(constants.CREATED);

      post = await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors/`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR3);

      expect(post.statusCode).toBe(constants.CREATED);

      let getSens = await request(app)
        .get(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors/${constants.SENSOR3.macAddress}/stats`
        )
        .set("Authorization", `Bearer ${operatorToken}`);

      let body1 = getSens.body;
      expect(getSens.statusCode).toBe(constants.OK);
      expect(body1).toHaveProperty("mean");
      expect(body1).toHaveProperty("variance");
      expect(body1).toHaveProperty("upperThreshold");
      expect(body1).toHaveProperty("lowerThreshold");

      expect(body1.mean).toBeCloseTo(0);
      expect(body1.variance).toBeCloseTo(0);
      expect(body1.upperThreshold).toBeCloseTo(0);
      expect(body1.lowerThreshold).toBeCloseTo(0);

      let getNet = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK2.code}/stats`)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(getNet.statusCode).toBe(constants.OK);
      expect(Array.isArray(getNet.body)).toBeTruthy();
      expect(getNet.body.length).toBe(1);

      let measures = getNet.body;
      measures.forEach((measure) => {
        if (measure.hasOwnProperty("stats")) {
          expect(measure.stats).toHaveProperty("mean");
          expect(measure.stats).toHaveProperty("variance");
          expect(measure.stats).toHaveProperty("upperThreshold");
          expect(measure.stats).toHaveProperty("lowerThreshold");

          expect(measure.stats.mean).toBeCloseTo(0);
          expect(measure.stats.variance).toBeCloseTo(0);
          expect(measure.stats.upperThreshold).toBeCloseTo(0);
          expect(measure.stats.lowerThreshold).toBeCloseTo(0);
        }
      });
    });
  });

  describe("Verify what happens when an array of sensor mac is passed to get network measurementsS", () => {
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
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR1);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR1.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send([constants.MEASURE1, constants.MEASURE2]);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR2);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK1.code}/gateways/${constants.GW1.macAddress}/sensors/${constants.SENSOR2.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send([constants.MEASURE1, constants.MEASURE2]);

      await request(app)
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.NETWORK2);

      await request(app)
        .post(`/api/v1/networks/${constants.NETWORK2.code}/gateways/`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.GW2);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.SENSOR3);

      await request(app)
        .post(
          `/api/v1/networks/${constants.NETWORK2.code}/gateways/${constants.GW2.macAddress}/sensors/${constants.SENSOR3.macAddress}/measurements`
        )
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(constants.OUTLIER_ARRAY);
    });

    afterAll(async () => {
      await afterAllE2e();
    });

    it("should return stats about the specified sensor mac passed as a query parameter", async () => {
      const sensorsMacs = [
        constants.SENSOR1.macAddress,
        constants.SENSOR2.macAddress,
        constants.SENSOR3.macAddress
      ];
      const correctSetofMacs = [
        constants.SENSOR1.macAddress,
        constants.SENSOR2.macAddress
      ];

      const req = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/measurements`)
        .set("Authorization", `Bearer ${viewerToken}`)
        .query({ sensorMacs: sensorsMacs });

      expect(req.statusCode).toBe(constants.OK);
      expect(Array.isArray(req.body)).toBeTruthy();
      expect(req.body.length).toBe(2);

      let measures = req.body;
      measures.forEach((measure) => {
        expect(measure).toHaveProperty("sensorMacAddress");
        expect(measure).toHaveProperty("measurements");
        expect(
          correctSetofMacs.includes(measure.sensorMacAddress)
        ).toBeTruthy();
      });
    });

    it("should return NO measurements if the date range is not containing measurements", async () => {
      const startDate = "2024-02-18T16:20:00Z";
      const endDate = "2024-02-20T16:20:00Z";

      const req = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/measurements`)
        .set("Authorization", `Bearer ${viewerToken}`)
        .query({ startDate: startDate, endDate: endDate });
      expect(req.statusCode).toBe(constants.OK);
      expect(Array.isArray(req.body)).toBeTruthy();
      expect(req.body.length).toBe(2);

      let sensors = req.body;
      sensors.forEach((sensor) => {
        expect(sensor).toHaveProperty("sensorMacAddress");
        if (sensor.hasOwnProperty("measurements"))
          expect(sensor.measurements.length == 0).toBeTruthy();
      });
    });

    it("should return the measurements if the date range is containing them", async () => {
      const startDate = "2024-02-18T16:20:00Z";
      const endDate = "2026-02-20T16:20:00Z";

      const req = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/measurements`)
        .set("Authorization", `Bearer ${viewerToken}`)
        .query({ startDate: startDate, endDate: endDate });

      expect(req.statusCode).toBe(constants.OK);
      expect(Array.isArray(req.body)).toBeTruthy();
      expect(req.body.length).toBe(2);

      let sensors = req.body;
      sensors.forEach((sensor) => {
        expect(sensor).toHaveProperty("sensorMacAddress");
        expect(sensor).toHaveProperty("measurements");
        expect(sensor.measurements.length == 2).toBeTruthy();
        expect(sensor).toHaveProperty("stats");
        expect(isIsoUtcString(sensor.stats.startDate)).toBeTruthy();
        expect(roundToSeconds(new Date(sensor.stats.startDate))).toBe(
          roundToSeconds(new Date(startDate))
        );
        expect(isIsoUtcString(sensor.stats.endDate)).toBeTruthy();
        expect(roundToSeconds(new Date(sensor.stats.endDate))).toBe(
          roundToSeconds(new Date(endDate))
        );
      });
    });

    it("should return only the measurements included in the date range if containing them", async () => {
      const startDate = "2024-02-18T15:00:00Z";
      const endDate = "2025-02-18T16:05:00Z";

      const req = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/measurements`)
        .set("Authorization", `Bearer ${viewerToken}`)
        .query({ startDate: startDate, endDate: endDate });

      expect(req.statusCode).toBe(constants.OK);
      expect(Array.isArray(req.body)).toBeTruthy();
      expect(req.body.length).toBe(2);

      let sensors = req.body;
      sensors.forEach((sensor) => {
        expect(sensor).toHaveProperty("sensorMacAddress");
        expect(sensor).toHaveProperty("measurements");
        expect(sensor.measurements.length == 1).toBeTruthy();
        expect(sensor).toHaveProperty("stats");
        expect(isIsoUtcString(sensor.stats.startDate)).toBeTruthy();
        expect(roundToSeconds(new Date(sensor.stats.startDate))).toBe(
          roundToSeconds(new Date(startDate))
        );
        expect(isIsoUtcString(sensor.stats.endDate)).toBeTruthy();
        expect(roundToSeconds(new Date(sensor.stats.endDate))).toBe(
          roundToSeconds(new Date(endDate))
        );
      });
    });

    it("should provide an empty array of measurements if the two dates are inverted", async () => {
      const startDate = "2024-02-18T15:00:00Z";
      const endDate = "2025-02-18T16:05:00Z";

      const req = await request(app)
        .get(`/api/v1/networks/${constants.NETWORK1.code}/measurements`)
        .set("Authorization", `Bearer ${viewerToken}`)
        .query({ startDate: endDate, endDate: startDate });

      expect(req.statusCode).toBe(constants.OK);
      expect(Array.isArray(req.body)).toBeTruthy();
      expect(req.body.length).toBe(2);

      let sensors = req.body;
      sensors.forEach((sensor) => {
        expect(sensor).toHaveProperty("sensorMacAddress");
        if (sensor.hasOwnProperty("measurements"))
          expect(sensor.measurements.length == 0).toBeTruthy();
      });
    });
  });
});
