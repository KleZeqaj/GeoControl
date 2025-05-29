// tests/e2e/measurement/measurement.e2e.test.ts
import { app } from "@app";
import * as measurementController from "@controllers/measurementController";
import { MeasurementRepository } from "@repositories/MeasurementRepository";
import { generateToken } from "@services/authService";
import {
    afterAllE2e,
    beforeAllE2e,
    TEST_GATEWAYS,
    TEST_NETWORKS,
    TEST_SENSORS,
    TEST_USERS
} from "@test/e2e/lifecycle";
import request from "supertest";

import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import {
    closeTestDataSource,
    initializeTestDataSource,
    TestDataSource
} from "@test/setup/test-datasource";


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

    const mesureRepo = new MeasurementRepository();

    const insertMeasure = async (sensorMacAddress) => {
        const map = new Map<Date, number>();
        map.set(new Date("2025-02-18T17:00:00+01:00"), 1.8);
        map.set(new Date("2025-02-19T17:00:00+01:00"), 5);
        map.set(new Date("2025-02-20T17:00:00+01:00"), 10);
        map.set(new Date("2025-02-21T17:00:00+01:00"), 15);
        map.set(new Date("2025-02-22T17:00:00+01:00"), 20);

        await mesureRepo.storeMeasurements(netCode, gwMac, sensorMacAddress, map);
    }

    beforeEach(async () => {
        await TestDataSource.getRepository(MeasurementDAO).clear();    
    });

    beforeAll(async () => {
        await initializeTestDataSource();
        await beforeAllE2e();
        adminToken  = generateToken(TEST_USERS.admin);
        opToken     = generateToken(TEST_USERS.operator);
        viewerToken = generateToken(TEST_USERS.viewer);
    });

    afterAll(async () => {
        await closeTestDataSource();
        await afterAllE2e();
    });

describe("GET /networks/:net/gateways/:gat/sensors/:sens/measurements", () => {
    it("get all measurements of a specific sensor: 200 ", async () => {
        await insertMeasure(sensMac);
        const should_return = {
            sensorMacAddress: 'DD:DD:DD:DD:DD:DD',
            stats: {
                startDate: '2025-02-18T16:00:00Z',
                endDate: '2025-02-22T16:00:00Z',
                mean: 10.36,
                variance: 43.32,
                upperThreshold: 23.52,
                lowerThreshold: -2.8
            },
            measurements: [
                { createdAt: '2025-02-18T16:00:00Z', value: 1.8, isOutlier: false },
                { createdAt: '2025-02-19T16:00:00Z', value: 5, isOutlier: false },
                { createdAt: '2025-02-20T16:00:00Z', value: 10, isOutlier: false },
                { createdAt: '2025-02-21T16:00:00Z', value: 15, isOutlier: false },
                { createdAt: '2025-02-22T16:00:00Z', value: 20, isOutlier: false }
            ]
        }

        const res = await request(app)
            .get(sensorUrl)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.measurements.length).toBe(5);
        expect(res.body.measurements[2].value).toBe(10);
        expect(res.body).toMatchObject(should_return);
    });

     it("get all measurements of a specific sensor: 40O BadRequest", async () => {
        const res = await request(app)
            .get(sensorUrl)
            .query({ startDate: "not-a-date", endDate: "12345" })
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
    });

    it("get all measurements of a specific sensor: 401 Unauthorized Error", async () => {
        await insertMeasure(sensMac);

        const ok = await request(app)
            .get(sensorUrl)
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(ok.status).toBe(200);

        const bad = await request(app)
            .get(sensorUrl)
            .set("Authorization", `Bearer invalid`);
        expect(bad.status).toBe(401);
        expect(bad.body.name).toBe("UnauthorizedError");
        
    });

    it("get allmeasuremetns of a specific sensor: 404 NotFoundError", async () => {
        await insertMeasure(sensMac);

        const ok = await request(app)
            .get(sensorUrl)
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(ok.status).toBe(200);

        const bad = await request(app)
            .get(`/api/v1/networks/NET05/gateways/${gwMac}/sensors/${sensMac}/measurements`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(bad.status).toBe(404);
        expect(bad.body.name).toBe("NotFoundError");

        const bad1 = await request(app)
            .get(`/api/v1/networks/NET01/gateways/KK:KK:KK:KK:KK:KK/sensors/${sensMac}/measurements`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(bad1.status).toBe(404);
        expect(bad1.body.name).toBe("NotFoundError");

        const bad2 = await request(app)
            .get(`/api/v1/networks/NET01/gateways/${gwMac}/sensors/99:99:99:99:99:99/measurements`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(bad2.status).toBe(404);
        expect(bad2.body.name).toBe("NotFoundError");
        
    });

    it("get all measurments of a specific sensor: 500 Internal Server Error", async () => {
        const fakeError = new Error("Issues");
        const getAll_for_sensor_mock = jest.spyOn(measurementController, 'getAllMeasurementsOfSensor').mockRejectedValue(fakeError);
        
        const bad = await request(app)
            .get(`/api/v1/networks/NET01/gateways/${gwMac}/sensors/${sensMac}/measurements`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(bad.status).toBe(500);
        expect(bad.body.message).toBe("Issues");

        getAll_for_sensor_mock.mockRestore();
    });
});


describe("GET /networks/:net/measurements", () => {
    it("get all measurements for a set of sensors of a specific network: 200 Measurements retrived", async () => {
        const should_return = [{
            sensorMacAddress: 'DD:DD:DD:DD:DD:DD',
            stats: {
                startDate: '2025-02-18T16:00:00Z',
                endDate: '2025-02-22T16:00:00Z',
                mean: 10.36,
                variance: 43.32,
                upperThreshold: 23.52,
                lowerThreshold: -2.8
            },
            measurements: [
                { createdAt: '2025-02-18T16:00:00Z', value: 1.8, isOutlier: false },
                { createdAt: '2025-02-19T16:00:00Z', value: 5, isOutlier: false },
                { createdAt: '2025-02-20T16:00:00Z', value: 10, isOutlier: false },
                { createdAt: '2025-02-21T16:00:00Z', value: 15, isOutlier: false },
                { createdAt: '2025-02-22T16:00:00Z', value: 20, isOutlier: false }
            ]
            },
            { sensorMacAddress: 'EE:EE:EE:EE:EE:EE' },
            { sensorMacAddress: 'FF:FF:FF:FF:FF:FF' }
        ]

        await insertMeasure(sensMac);

        const res = await request(app)
            .get(networkUrl)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject(should_return);
    });

    it("get all measurements for a set of sensors of a specific network: 400 BadRequest", async() => {
        const res = await request(app)
            .get(networkUrl)
            .query({ startDate: "not-a-date", endDate: "12345" })
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
    })

    it("get all measurements for a set of sensors of a specific network: 401 Unauthorized Error", async() => {
        await insertMeasure(sensMac);

        const res = await request(app)
            .get(networkUrl)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);

        const bad = await request(app)
            .get(networkUrl)
            .set("Authorization", `Bearer prova`);

        expect(bad.status).toBe(401);
        expect(bad.body.name).toBe("UnauthorizedError")
    });

    it("get all measurements for a set of sensors of a specific network: 404 NotFoundError", async () => {
        const res = await request(app)
            .get(`${BASE}/NOPE/measurements`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(404);
    
    });

     it("get all measurements for a set of sensors of a specific network: 500 Internal Server Error", async () => {
        const fakeError = new Error("Issues");
        const getAll_for_network_mock = jest.spyOn(measurementController, 'getAllMeasurementsOfNetwork').mockRejectedValue(fakeError);
        
        const bad = await request(app)
            .get(`/api/v1/networks/NET01/measurements`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(bad.status).toBe(500);
        expect(bad.body.message).toBe("Issues");

        getAll_for_network_mock.mockRestore();
    });
    
 });

    


describe("POST /networks/:net/gateways/:gat/sensors/:sens/measurements", () => {
    const postUrl = sensorUrl;
    const measureRepo = new MeasurementRepository();

    it("insert new measurements for a sensor: 201 Measurement created", async () => {
        const getAll_of_networks = await measurementController.getAllMeasurementsOfNetwork("NET01", []);
        const values = [{
                createdAt: "2025-02-18T17:00:00+01:00",
                value: 1.8567
            }];
        
        const res = await request(app)
            .post(postUrl)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(values)
        expect(res.status).toBe(201);

        const res1 = await request(app)
            .get("/api/v1/networks/NET01/measurements")
            .set("Authorization", `Bearer ${adminToken}`)
        
        expect(res1.body).toHaveLength(3);
    });

    it("insert new measurements for a sensor: 400 BadRequest", async () => {
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

    it("insert new measurements for a sensor: 401 UnauthorizedError", async () => {
        const values = [{
            createdAt: "2025-02-18T17:00:00+01:00",
            value: 1.8567
        }];

        const r1 = await request(app)
            .post(postUrl)
            .set("Authorization", `Bearer nope`)
            .send(values);
        
        expect(r1.status).toBe(401);
        expect(r1.body.name).toBe("UnauthorizedError")
    });

    it("insert new measurements for a sensor: 403 InsufficientRightsError", async () => {
        const values = [{
            createdAt: "2025-02-18T17:00:00+01:00",
            value: 1.8567
        }];
        
        const res = await request(app)
            .post(postUrl)
            .set("Authorization", `Bearer ${viewerToken}`)
            .send(values)
        expect(res.status).toBe(403);
    });

    it("insert new measurements for a sensor: 404 NotFoundError", async () => {
        const values = [{
            createdAt: "2025-02-18T17:00:00+01:00",
            value: 1.8567
        }];

        const res1 = await request(app)
            .post(`/api/v1/networks/NET07/gateways/${gwMac}/sensors/${sensMac}/measurements`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(values);
        
        expect(res1.status).toBe(404);

        const res2 = await request(app)
            .post(`/api/v1/networks/NET01/gateways/11:11:11:11:11:11/sensors/${sensMac}/measurements`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(values);
        
        expect(res2.status).toBe(404);

        const res3 = await request(app)
            .post(`/api/v1/networks/NET01/gateways/${gwMac}/sensors/99:99:99:99:99:99/measurements`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(values);
        
        expect(res3.status).toBe(404);
    });
    
    it("insert new measurements for a sensor: 500 InternalServerError", async () => {
        const values = [{
            createdAt: "2025-02-18T17:00:00+01:00",
            value: 1.8567
        }];

        const fakeError = new Error("Issues");
        const storeMock = jest.spyOn(measurementController, 'storeMeasurements').mockRejectedValue(fakeError);
        

        const res1 = await request(app)
            .post(`/api/v1/networks/NET01/gateways/${gwMac}/sensors/${sensMac}/measurements`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(values);

        expect(res1.status).toBe(500);
        storeMock.mockRestore();
    })
}) 

describe("GET /networks/{networksCode}/stats", () => {
    it("get stats of a set of sensors of a specific network: 200 Statistics retrived", async () => {
        await insertMeasure(sensMac);

        const res = await request(app)
            .get("/api/v1/networks/NET01/stats")
            .set("Authorization", `Bearer ${adminToken}`)
        
        expect(res.status).toBe(200);
        expect(res.body[0].stats.mean).toBe(10.36);
        expect(res.body[0].stats.variance).toBe(43.32);
        expect(res.body[0].stats.upperThreshold).toBe(23.52);
        expect(res.body[0].stats.lowerThreshold).toBe(-2.80);
    });

    it("get stats of a set of sensors of a specific network: 400 BadRequest", async () => {
        await insertMeasure(sensMac);

        const res = await request(app)
            .get("/api/v1/networks/NET01/stats")
            .query({ startDate: "not-a-date", endDate: "12345" })
            .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(400);
        
    })

    it("get stats of a set of sensors of a specific network: 401 UnauthorizedError", async () => {
        await insertMeasure(sensMac);

        const res = await request(app)
            .get("/api/v1/networks/NET01/stats")
            .set("Authorization", `Bearer`)
        expect(res.status).toBe(401)
    })

    it("get stats of a set of sensors of a specific network: 404 ConflictError", async () => {
        await insertMeasure(sensMac);

        const res = await request(app)
            .get(`/api/v1/networks/NET07/stats`)
            .set("Authorization", `Bearer ${adminToken}`)
        
        expect(res.status).toBe(404);
    })

    it("get stats of a set of sensors of a specific network: 500 InternalServerError", async () => {
        const fakeError = new Error("Issues");
        const getStatsMock = jest.spyOn(measurementController, 'getAllStatsOfNetwork').mockRejectedValue(fakeError);

        const res = await request(app)
            .get(`/api/v1/networks/NET01/stats`)
            .set("Authorization", `Bearer ${adminToken}`)

        expect(res.status).toBe(500);
        expect(res.body.message).toMatch("Issues");

        getStatsMock.mockRestore();
    })

});

describe("GET /networks/{networkCode}/outliers", () => {
    it("get outliers measurements for sensors of a network: 200 Outlier measurements retrieved", async () => {
        const m = new Map<Date, number>();
        m.set(new Date("2025-02-18T17:00:00+01:00"), 1.8);
        m.set(new Date("2025-02-19T17:00:00+01:00"), 2);
        m.set(new Date("2025-02-20T17:00:00+01:00"), 2.3);
        m.set(new Date("2025-02-21T17:00:00+01:00"), 2.1);
        m.set(new Date("2025-02-22T17:00:00+01:00"), 50);
        m.set(new Date("2025-02-23T17:00:00+01:00"), 3);
        m.set(new Date("2025-02-24T17:00:00+01:00"), 3.1);
        m.set(new Date("2025-02-25T17:00:00+01:00"), 75);

        await mesureRepo.storeMeasurements(netCode, gwMac, sensMac, m);
        const res = await request(app)
            .get("/api/v1/networks/NET01/outliers")
            .query({startDate: "2025-02-18T15:00:00Z", endDate: "2025-02-23T18:00:00Z"})
            .set("Authorization", `Bearer ${adminToken}`);

       expect(res.body[0].measurements[0].isOutlier).toBe(true);
       expect(res.body[0].measurements[0].value).toBe(50);
    });

    it("get outliers measurements for sensors of a network: 400 BadRequest", async () => {
        await insertMeasure(sensMac);

        const res = await request(app)
            .get("/api/v1/networks/NET01/outliers")
            .query({ startDate: "not-a-date", endDate: "12345" })
            .set("Authorization", `Bearer`)
        expect(res.status).toBe(400)
        
    });

    it("get outliers measurements for sensors of a network: 401 UnauthorizedError", async () => {
        await insertMeasure(sensMac);

        const res = await request(app)
            .get("/api/v1/networks/NET01/outliers")
            .set("Authorization", `Bearer`)
        expect(res.status).toBe(401)
    });

    it("get outliers measurements for sensors of a network: 404 NotFoundError", async () => {
        await insertMeasure(sensMac);

        const res = await request(app)
            .get(`/api/v1/networks/NET07/outliers`)
            .set("Authorization", `Bearer ${adminToken}`)
        
        expect(res.status).toBe(404);
    });


    it("get outliers measurements for sensors of a network: 500 InternalServerError", async () => {
        const fakeError = new Error("Issues");
        const getOutMock = jest.spyOn(measurementController, 'getAllOutliersOfNetwork').mockRejectedValue(fakeError);

        const res = await request(app)
            .get(`/api/v1/networks/NET01/outliers`)
            .set("Authorization", `Bearer ${adminToken}`)

        expect(res.status).toBe(500);
        expect(res.body.message).toMatch("Issues");

        getOutMock.mockRestore();
    });
    
})


describe("GET /networks/{netwrokCode}/gateways/{gatewayMac}/sensors/{sensorMac}/stats", () => {
    it("get stats of a specific sensor: 200 Statistics retrived", async () => {
        await insertMeasure(sensMac);

        const res = await request(app)
            .get("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD/stats")
            .set("Authorization", `Bearer ${adminToken}`)

        expect(res.status).toBe(200);
        expect(res.body.mean).toBe(10.36);
        expect(res.body.variance).toBe(43.32);
    });

    it("get stats of a specific sensor: 400 BadRequest", async () => {
        await insertMeasure(sensMac);

        const res = await request(app)
            .get(`/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/${sensMac}/stats`)
            .query({ startDate: "not-a-date", endDate: "12345" })
            .set("Authorization", `Bearer`)

        expect(res.status).toBe(400)
        
    });

    it("get stats of a specific sensor: 401 Unauthorized", async () => {
        await insertMeasure(sensMac);

        const res = await request(app)
            .get("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/11:11:11:11:11:11/stats")
            .set("Authorization", `Bearer`)
        expect(res.status).toBe(401)
    });

    it("get stats of a specific sensor: 404 NotFound", async () => {
        await insertMeasure(sensMac);

        const res = await request(app)
            .get(`/api/v1/networks/NET07/gateways/${gwMac}/sensors/${sensMac}/stats`)
            .set("Authorization", `Bearer ${adminToken}`)
        
        expect(res.status).toBe(404);

        const res1 = await request(app)
            .get(`/api/v1/networks/NET01/gateways/11:11:11:11:11:11/sensors/${sensMac}/stats`)
            .set("Authorization", `Bearer ${adminToken}`)
        
        expect(res1.status).toBe(404);

        const res2 = await request(app)
            .get(`/api/v1/networks/NET01/gateways/${gwMac}/sensors/99:99:99:99:99:99/stats`)
            .set("Authorization", `Bearer ${adminToken}`)
        
        expect(res2.status).toBe(404);
        
    });

    it("get stats of a specific sensor: 500 InternalServerError", async () => {
        const fakeError = new Error("Issues");
        const getStatsMock = jest.spyOn(measurementController, 'getAllStatsOfSensor').mockRejectedValue(fakeError);

        const res = await request(app)
            .get(`/api/v1/networks/NET01/gateways/${gwMac}/sensors/${sensMac}/stats`)
            .set("Authorization", `Bearer ${adminToken}`);
        
        expect(res.status).toBe(500);
        expect(res.body.message).toMatch("Issues");

        getStatsMock.mockRestore();
    });
})

describe("GET /networks/{netwrokCode}/gateways/{gatewayMac}/sensors/{sensorMac}/outliers", () => {
    it("get outliers of a specific sensors: 200 Outlier measurements retrieved", async () => {
        const m = new Map<Date, number>();
        m.set(new Date("2025-02-18T17:00:00+01:00"), 1.8);
        m.set(new Date("2025-02-19T17:00:00+01:00"), 2);
        m.set(new Date("2025-02-22T17:00:00+01:00"), 50);
        m.set(new Date("2025-02-23T17:00:00+01:00"), 3);
        m.set(new Date("2025-02-25T17:00:00+01:00"), 150);
        m.set(new Date("2025-02-26T17:00:00+01:00"), 1);

        await mesureRepo.storeMeasurements(netCode, gwMac, sensMac, m);
        const res = await request(app)
            .get("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/DD:DD:DD:DD:DD:DD/outliers")
            .query({startDate: "2025-02-18T15:00:00Z", endDate: "2025-02-27T18:00:00Z"})
            .set("Authorization", `Bearer ${adminToken}`);

        console.log(res.body)
        expect(res.status).toBe(200);
        expect(res.body.measurements[0].value).toBe(150);        
    });

    it("get outliers of a specific sensors: 400 BadRequest", async () => {
        await insertMeasure(sensMac);

        const res = await request(app)
            .get(`/api/v1/networks/NET01/gateways/${gwMac}/sensors/${sensMac}/outliers`)
            .query({ startDate: "not-a-date", endDate: "12345" })
            .set("Authorization", `Bearer ${adminToken}`);
        
        expect(res.status).toBe(400);
    });

    it("get outliers of a specific sensors: 401 Unauthorized", async () => {
        await insertMeasure(sensMac);

        const res = await request(app)
            .get("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA/sensors/11:11:11:11:11:11/outliers")
            .set("Authorization", `Bearer`)
        expect(res.status).toBe(401)
    });

    it("get outliers of a specific sensors: 404 NotFound", async () => {
        await insertMeasure(sensMac);

        const res = await request(app)
            .get(`/api/v1/networks/NET07/gateways/${gwMac}/sensors/${sensMac}/outliers`)
            .set("Authorization", `Bearer ${adminToken}`)
        
        expect(res.status).toBe(404);

        const res1 = await request(app)
            .get(`/api/v1/networks/NET01/gateways/11:11:11:11:11:11/sensors/${sensMac}/outliers`)
            .set("Authorization", `Bearer ${adminToken}`)
        
        expect(res1.status).toBe(404);

        const res2 = await request(app)
            .get(`/api/v1/networks/NET01/gateways/${gwMac}/sensors/99:99:99:99:99:99/outliers`)
            .set("Authorization", `Bearer ${adminToken}`)
        
        expect(res2.status).toBe(404);

    });    

    it("get outliers of a specific sensors: 500 InternalServer", async () => {
        const fakeError = new Error("Issues");
        const getOutMock = jest.spyOn(measurementController, 'getAllOutliersOfSensor').mockRejectedValue(fakeError);

        const res = await request(app)
            .get(`/api/v1/networks/NET01/gateways/${gwMac}/sensors/${sensMac}/outliers`)
            .set("Authorization", `Bearer ${adminToken}`);
        
        expect(res.status).toBe(500);
        expect(res.body.message).toMatch("Issues");

        getOutMock.mockRestore();
    }); 
})

});
