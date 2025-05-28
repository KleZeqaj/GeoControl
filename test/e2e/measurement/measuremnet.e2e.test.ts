// tests/e2e/measurement/measurement.e2e.test.ts

import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import {
  beforeAllE2e,
  afterAllE2e,
  TEST_USERS,
  TEST_NETWORKS,
  TEST_GATEWAYS,
  TEST_SENSORS
} from "@test/e2e/lifecycle";

const BASE = "/api/v1/networks";

describe("Measurements E2E", () => {
  let adminToken: string;
  let opToken: string;
  let viewerToken: string;

  const netCode  = TEST_NETWORKS.network1.code;
  const gwMac    = TEST_GATEWAYS.gateway1.macAddress;
  const sensMac  = TEST_SENSORS.sensor1.macAddress;

  const sensorUrl  = `${BASE}/${netCode}/gateways/${gwMac}/sensors/${sensMac}/measurements`;
  const networkUrl = `${BASE}/${netCode}/measurements`;

  beforeAll(async () => {
    await beforeAllE2e();
    adminToken  = generateToken(TEST_USERS.admin);
    opToken     = generateToken(TEST_USERS.operator);
    viewerToken = generateToken(TEST_USERS.viewer);
  });

  afterAll(async () => {
    await afterAllE2e();
  });


  describe("GET /networks/:net/gateways/:gat/sensors/:sens/measurements", () => {
    it("200 – lista tutte le misurazioni di un sensore", async () => {
      const res = await request(app)
        .get(sensorUrl)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      res.body.forEach((m: any) => {
        expect(m).toHaveProperty("value");
        expect(m).toHaveProperty("createdAt");
      });
    });

    it("200 – filtra per startDate", async () => {
      const all = await request(app)
        .get(sensorUrl)
        .set("Authorization", `Bearer ${adminToken}`);
      const sampleStart = all.body[0].createdAt;

      const res = await request(app)
        .get(sensorUrl)
        .query({ startDate: sampleStart })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.every((m: any) => new Date(m.createdAt) >= new Date(sampleStart))).toBe(true);
    });

    it("200 – filtra per endDate", async () => {
      const all = await request(app)
        .get(sensorUrl)
        .set("Authorization", `Bearer ${adminToken}`);
      const sampleEnd = all.body[0].createdAt;

      const res = await request(app)
        .get(sensorUrl)
        .query({ endDate: sampleEnd })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.every((m: any) => new Date(m.createdAt) <= new Date(sampleEnd))).toBe(true);
    });

    it("200 – filtra per startDate e endDate", async () => {
      const all = await request(app)
        .get(sensorUrl)
        .set("Authorization", `Bearer ${adminToken}`);
      const start = all.body[0].createdAt;
      const end   = all.body[1]?.createdAt || start;

      const res = await request(app)
        .get(sensorUrl)
        .query({ startDate: start, endDate: end })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.every((m: any) => {
        const d = new Date(m.createdAt);
        return d >= new Date(start) && d <= new Date(end);
      })).toBe(true);
    });

    it("400 – query params malformati", async () => {
      const res = await request(app)
        .get(sensorUrl)
        .query({ startDate: "not-a-date", endDate: "12345" })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it("401/403 – token mancante, invalido o senza permessi", async () => {
      // viewer può leggere
      const ok = await request(app)
        .get(sensorUrl)
        .set("Authorization", `Bearer ${viewerToken}`);
      expect(ok.status).toBe(200);

      // token invalido → 401
      const bad = await request(app)
        .get(sensorUrl)
        .set("Authorization", `Bearer invalid`);
      expect(bad.status).toBe(401);
    });

    it("404 – network/gateway/sensor inesistenti", async () => {
      const mk = (n: string, g: string, s: string) =>
        `${BASE}/${n}/gateways/${g}/sensors/${s}/measurements`;

      const combos = [
        ["NOPE", gwMac, sensMac],
        [netCode, "00:00:00:00:00:00", sensMac],
        [netCode, gwMac, "11:11:11:11:11:11"]
      ] as const;

      for (const [n, g, s] of combos) {
        const r = await request(app)
          .get(mk(n, g, s))
          .set("Authorization", `Bearer ${adminToken}`);
        expect(r.status).toBe(404);
      }
    });
  });


  describe("GET /networks/:net/measurements", () => {
    it("200 – lista tutte le misurazioni di una rete", async () => {
      const res = await request(app)
        .get(networkUrl)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it("200 – operator e viewer possono leggere le misurazioni di una rete", async () => {
      for (const token of [opToken, viewerToken]) {
        const r = await request(app)
          .get(networkUrl)
          .set("Authorization", `Bearer ${token}`);
        expect(r.status).toBe(200);
      }
    });

    it("200 – filtra per sensorMacs multiple", async () => {
      const macs = [TEST_SENSORS.sensor1.macAddress, TEST_SENSORS.sensor2.macAddress].join(",");
      const res = await request(app)
        .get(networkUrl)
        .query({ sensorMacs: macs })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.every((m: any) => macs.split(",").includes(m.sensorMacAddress))).toBe(true);
    });

    it("200 – filtra per endDate", async () => {
      const all = (await request(app)
        .get(networkUrl)
        .set("Authorization", `Bearer ${adminToken}`)).body as any[];
      const sampleEnd = all[0].createdAt;

      const res = await request(app)
        .get(networkUrl)
        .query({ endDate: sampleEnd })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.every((m: any) => new Date(m.createdAt) <= new Date(sampleEnd))).toBe(true);
    });

    it("200 – filtra per startDate e endDate", async () => {
      const all = (await request(app)
        .get(networkUrl)
        .set("Authorization", `Bearer ${adminToken}`)).body as any[];
      const start = all[0].createdAt;
      const end   = all[1]?.createdAt || start;

      const res = await request(app)
        .get(networkUrl)
        .query({ startDate: start, endDate: end })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.every((m: any) => {
        const d = new Date(m.createdAt);
        return d >= new Date(start) && d <= new Date(end);
      })).toBe(true);
    });

    it("400 – query params malformati", async () => {
      const res = await request(app)
        .get(networkUrl)
        .query({ startDate: "foo", sensorMacs: 123 as any })
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
    });

    it("401 – senza token", async () => {
      const res = await request(app).get(networkUrl);
      expect(res.status).toBe(401);
    });

    it("404 – network inesistente", async () => {
      const res = await request(app)
        .get(`${BASE}/NOPE/measurements`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });


  describe("POST /networks/:net/gateways/:gat/sensors/:sens/measurements", () => {
    const postUrl = sensorUrl;

    it("201 – crea nuove misurazioni (admin & operator)", async () => {
      const payload = {
        values: {
          "2025-05-20T08:00:00.000Z": 42,
          "2025-05-20T09:00:00.000Z": 43
        }
      };

      for (const token of [adminToken, opToken]) {
        const res = await request(app)
          .post(postUrl)
          .set("Authorization", `Bearer ${token}`)
          .send(payload);
        expect(res.status).toBe(201);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
      }
    });

    it("403/401 – viewer o token invalido", async () => {
      const r1 = await request(app)
        .post(postUrl)
        .set("Authorization", `Bearer ${viewerToken}`)
        .send({ values: { "2025-05-21T00:00:00.000Z": 1 }});
      expect(r1.status).toBe(403);

      const r2 = await request(app)
        .post(postUrl)
        .set("Authorization", `Bearer nope`)
        .send({ values: { "2025-05-21T00:00:00.000Z": 1 }});
      expect(r2.status).toBe(401);
    });

    it("400 – payload mancante o malformato", async () => {
      const cases = [
        {},
        { values: "not-an-object" },
        { values: { "bad-date": 5 } }
      ];
      for (const body of cases) {
        const r = await request(app)
          .post(postUrl)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(body);
        expect(r.status).toBe(400);
      }
    });

    it("404 – network/gateway/sensor inesistenti", async () => {
      const mk = (n: string, g: string, s: string) =>
        `${BASE}/${n}/gateways/${g}/sensors/${s}/measurements`;
      const body = { values: { "2025-05-22T00:00:00.000Z": 1 } };

      const combos = [
        ["NOPE", gwMac, sensMac],
        [netCode, "00:00:00:00:00:00", sensMac],
        [netCode, gwMac, "11:11:11:11:11:11"]
      ] as const;

      for (const [n, g, s] of combos) {
        const r = await request(app)
          .post(mk(n, g, s))
          .set("Authorization", `Bearer ${adminToken}`)
          .send(body);
        expect(r.status).toBe(404);
      }
    });
  });
});
