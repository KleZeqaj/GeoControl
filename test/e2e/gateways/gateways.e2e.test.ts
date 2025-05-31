
import { app } from "@app";
import { NotFoundError } from "@models/errors/NotFoundError";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { generateToken } from "@services/authService";
import { afterAllE2e, beforeAllE2e, TEST_USERS } from "@test/e2e/lifecycle";
import request from "supertest";

describe("GET /networks/{networkCode}/gateways/{gatewayMac}", () => {
    let token : String;

    beforeAll(async () => {
        await beforeAllE2e();
        token = generateToken(TEST_USERS.admin);
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    it("get a specific gateway", async () => {
        const res = await request(app)
            .get("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA")
            .set("Authorization", `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.macAddress).toBe("AA:AA:AA:AA:AA:AA");
        expect(res.body.name).toBe("GW01");
        expect(res.body.description).toBe("Descrizione GW01");
    })

    it("get a specific gateway: invalid token", async () => {
        const res = await request(app)
            .get("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA")
            .set("Authorization", `Bearer ${generateToken(TEST_USERS.admin)}`);
        
        expect(res.status).toBe(200);

        const res2 = await request(app)
            .get("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA")
            .set("Authorization", `Bearer ${generateToken(TEST_USERS.operator)}`);
        
        expect(res2.status).toBe(200);

        const res3 = await request(app)
            .get("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA")
            .set("Authorization", `Bearer ${generateToken(TEST_USERS.viewer)}`);
            
        expect(res3.status).toBe(200);

        const res4 = await request(app)
            .get("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA")
            .set("Authorization", `Bearer`);

        expect(res4.status).toBe(401);
    })

    it("get a gateway: not found errors", async () => {
        const res1 = await request(app)
            .get("/api/v1/networks/NET01/gateways/DD:DD:DD:DD:DD:DD")
            .set("Authorization", `Bearer ${token}`);
        
        expect(res1.status).toBe(404)

        const res2 = await request(app)
            .get("/api/v1/networks/NET05/gateways/AA:AA:AA:AA:AA:AA")
            .set("Authorization", `Bearer ${token}`);
        
        expect(res2.status).toBe(404)
    })

})

describe("GET /networks/{networkCode}/gateways", () => {
    let token : String;

    beforeAll(async () => {
        await beforeAllE2e();
        token = generateToken(TEST_USERS.admin);
    });

    afterAll(async () => {
        await afterAllE2e();
    });

     it("get all gateways of a specific network", async() => {
        const res = await request(app)
            .get("/api/v1/networks/NET01/gateways")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(3);

        const macAddresses = res.body.map((m: any) => m.macAddress).sort();
        const names = res.body.map((m: any) => m.name).sort();
        const descriptions = res.body.map((m: any) => m.description).sort();

        expect(macAddresses).toEqual(["AA:AA:AA:AA:AA:AA", "BB:BB:BB:BB:BB:BB", "CC:CC:CC:CC:CC:CC"]);
        expect(names).toEqual(["GW01", "GW02", "GW03"]);
        expect(descriptions).toEqual(["Descrizione GW01", "Descrizione GW02", "Descrizione GW03"]);
    })

    it("get all gateways of a specifc network: invalid token", async () => {
        const res = await request(app)
            .get("/api/v1/networks/NET01/gateways")
            .set("Authorization", `Bearer ${generateToken(TEST_USERS.admin)}`);
        
        expect(res.status).toBe(200);

        const res2 = await request(app)
            .get("/api/v1/networks/NET01/gateways")
            .set("Authorization", `Bearer ${generateToken(TEST_USERS.operator)}`);
        
        expect(res2.status).toBe(200);

        const res3 = await request(app)
            .get("/api/v1/networks/NET01/gateways")
            .set("Authorization", `Bearer ${generateToken(TEST_USERS.viewer)}`);
            
        expect(res3.status).toBe(200);

        const res4 = await request(app)
            .get("/api/v1/networks/NET01/gateways")
            .set("Authorization", `Bearer`);

        expect(res4.status).toBe(401);
    })

    it("get all gateways of a network: not found", async () =>{
        const res = await request(app)
            .get("/api/v1/networks/NET05/gateways")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(404);
    })

})

describe("POST /networks/{networkCode}/gateways", () => {
    let token : String;

    beforeAll(async () => {
        await beforeAllE2e();
        token = generateToken(TEST_USERS.admin);
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    it("create a gateway", async () => {
        const res = await request(app)
                .post("/api/v1/networks/NET01/gateways")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    macAddress: "DD:DD:DD:DD:DD:DD",
                    name: "GW04",
                    description: "Descrizione GW04"
                });
        expect(res.status).toBe(201)

        const gatewayRepo = new GatewayRepository();
        const gateway = await gatewayRepo.getGatewayByMacAddress("NET01", "DD:DD:DD:DD:DD:DD");
        expect(gateway).toMatchObject({
            macAddress: "DD:DD:DD:DD:DD:DD",
            name: "GW04",
            description: "Descrizione GW04"
        });

        
        const res2 = await request(app)
                .post("/api/v1/networks/NET01/gateways")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    macAddress: "FF:FF:FF:FF:FF:FF"
                });
        expect(res2.status).toBe(201)

        const gateway1 = await gatewayRepo.getGatewayByMacAddress("NET01", "FF:FF:FF:FF:FF:FF");
        expect(gateway1).toMatchObject({
            macAddress: "FF:FF:FF:FF:FF:FF",
            name: null,
            description: null
        })        
    })


    it("create a gateway: unauthorized or insufficient rights", async () =>{
        const res = await request(app)
            .post("/api/v1/networks/NET01/gateways")
            .set("Authorization", `Bearer ${generateToken(TEST_USERS.viewer)}`)
            .send({
                macAddress: "DD:DD:DD:DD:DD:DD",
                name: "GW04",
                description: "Descrizione GW04"
            });
        expect(res.status).toBe(403);



        const res1 = await request(app)
            .post("/api/v1/networks/NET01/gateways")
            .set("Authorization", `Bearer`)
            .send({
                macAddress: "DD:DD:DD:DD:DD:DD",
                name: "GW04",
                description: "Descrizione GW04"
            });
        expect(res1.status).toBe(401);
    })

    it("create a gateway: missing/wrong fields", async () => {
        const res = await request(app)
            .post("/api/v1/networks/NET01/gateways")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "GW04",
                description: "Descrizione GW04"
            });
        expect(res.status).toBe(400);

        const res2 = await request(app)
            .post("/api/v1/networks/NET01/gateways")
            .set("Authorization", `Bearer ${token}`)
            .send({
                macAddress: 1,
                name: "GW04",
                description: "Descrizione GW04"
            });
        expect(res2.status).toBe(400);

        const res3 = await request(app)
            .post("/api/v1/networks/NET01/gateways")
            .set("Authorization", `Bearer ${token}`)
            .send({
                macAddress: "11:11:11:11:11:11",
                name: 1,
                description: "Descrizione GW04"
            });
        expect(res3.status).toBe(400);

        const res4 = await request(app)
            .post("/api/v1/networks/NET01/gateways")
            .set("Authorization", `Bearer ${token}`)
            .send({
                macAddress: "11:11:11:11:11:11",
                name: "GW04",
                description: 1
            });
        expect(res4.status).toBe(400);

    })

    it("create a gateway: not found errors", async() => {
        const res = await request(app)
            .post("/api/v1/networks/NET05/gateways")
            .set("Authorization", `Bearer ${token}`)
            .send({
                macAddress: "11:11:11:11:11:11",
                name: "GW04",
                description: "Descrizione GW04"
        });

        expect(res.status).toBe(404);
    })

    it("create a gateway: conflict error", async() => {
        const res = await request(app)
            .post("/api/v1/networks/NET01/gateways")
            .set("Authorization", `Bearer ${token}`)
            .send({
                macAddress: "AA:AA:AA:AA:AA:AA",
                name: "GW04",
                description: "Descrizione GW04"
        });

        expect(res.status).toBe(409);
    })

})


describe("DELETE /networks/{networkCode}/gateways/{gatewayMac}", () => {
    let token : String;

    beforeAll(async () => {
        await beforeAllE2e();
        token = generateToken(TEST_USERS.admin);
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    it("delete a gateway", async () => {
        const gatewayRepo = new GatewayRepository();

        const res = await request(app)
            .delete("/api/v1/networks/NET01/gateways/CC:CC:CC:CC:CC:CC")
            .set("Authorization", `Bearer ${token}`);
        
        expect(res.status).toBe(204);
        await expect(gatewayRepo.getGatewayByMacAddress("NET01", "CC:CC:CC:CC:CC:CC")).rejects.toThrow(NotFoundError);

        const res2 = await request(app)
            .delete("/api/v1/networks/NET01/gateways/BB:BB:BB:BB:BB:BB")
            .set("Authorization", `Bearer ${generateToken(TEST_USERS.operator)}`);
        
        expect(res2.status).toBe(204);
        await expect(gatewayRepo.getGatewayByMacAddress("NET01", "BB:BB:BB:BB:BB:BB")).rejects.toThrow(NotFoundError);

    })


    it("delete gateway: unauthorized or insufficient rights", async () => {
        const res = await request(app)
            .delete("/api/v1/networks/NET01/gateways/CC:CC:CC:CC:CC:CC")
            .set("Authorization", `Bearer ${generateToken(TEST_USERS.viewer)}`);
        
        expect(res.status).toBe(403);

        const res2 = await request(app)
            .delete("/api/v1/networks/NET01/gateways/CC:CC:CC:CC:CC:CC")
            .set("Authorization", `Bearer `);
        
        expect(res2.status).toBe(401);        
    })

    it("delete gateway: not found errors", async () => {
        const res1 = await request(app)
            .delete("/api/v1/networks/NET07/gateways/AA:AA:AA:AA:AA:AA")
            .set("Authorization", `Bearer ${token}`);

        expect(res1.status).toBe(404);

        const res2 = await request(app)
            .delete("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:BB")
            .set("Authorization", `Bearer ${token}`);

        expect(res2.status).toBe(404);
    })
})


describe("PATCH /networks/{networkCode}/gateways/{gatewayMac}", () => {
    let token : String;

    beforeAll(async () => {
        await beforeAllE2e();
        token = generateToken(TEST_USERS.admin);
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    it("update gateway", async () => {
        const res = await request(app)
            .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA")
            .set("Authorization", `Bearer ${token}`)
            .send({
                macAddress: "00:11:22:33:44:66",
                name: "GW01 UPD",
                description: "Descrizion GW01 UPD",
            });

        expect(res.status).toBe(204);

        const gatewayRepo = new GatewayRepository();
        const gateway = await gatewayRepo.getGatewayByMacAddress("NET01", "00:11:22:33:44:66");
        expect(gateway).toMatchObject({
            macAddress: "00:11:22:33:44:66",
            name: "GW01 UPD",
            description: "Descrizion GW01 UPD"
        })


        const res2 = await request(app)
            .patch("/api/v1/networks/NET01/gateways/BB:BB:BB:BB:BB:BB")
            .set("Authorization", `Bearer ${generateToken(TEST_USERS.operator)}`)
            .send({
                macAddress: "00:11:22:33:44:77",
                name: "GW02 UPD",
                description: "Descrizion GW02 UPD",
            });

        expect(res2.status).toBe(204);

        const gateway2 = await gatewayRepo.getGatewayByMacAddress("NET01", "00:11:22:33:44:77");
        expect(gateway2).toMatchObject({
            macAddress: "00:11:22:33:44:77",
            name: "GW02 UPD",
            description: "Descrizion GW02 UPD"
        })

        const res3 = await request(app)
            .patch("/api/v1/networks/NET01/gateways/00:11:22:33:44:77")
            .set("Authorization", `Bearer ${generateToken(TEST_USERS.operator)}`)
            .send({
                macAddress: "BB:BB:BB:BB:BB:BB",
                name: "GW02 UPD",
                description: "Descrizion GW02 UPD",
            });

        expect(res3.status).toBe(204);

    })

    it("update gateway: unauthorized or insufficent rights", async () => {
        const res = await request(app)
            .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA")
            .set("Authorization", `Bearer ${generateToken(TEST_USERS.viewer)}`)
            .send({
                macAddress: "00:11:22:33:44:66",
                name: "GW01 UPD",
                description: "Descrizion GW01 UPD",
            });

        expect(res.status).toBe(403);

        const res2 = await request(app)
            .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA")
            .set("Authorization", `Bearer`)
            .send({
                macAddress: "00:11:22:33:44:66",
                name: "GW01 UPD",
                description: "Descrizion GW01 UPD",
            });

        expect(res2.status).toBe(401);
    })


    it("update gateway: missing/wrong fields", async () => {
        const res = await request(app)
            .patch("/api/v1/networks/NET01/gateways/00:11:22:33:44:66")
            .set("Authorization", `Bearer ${token}`)
            .send({
                macAddress: "AA:AA:AA:AA:AA:AA",
                name: "GW01 UPD",
                description: "Descrizion GW01 UPD",
            });

        expect(res.status).toBe(204);

        const res1 = await request(app)
            .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA")
            .set("Authorization", `Bearer ${token}`)
            .send({
                macAddress: 1,
                name: "GW01 UPD",
                description: "Descrizion GW01 UPD",
            });

        expect(res1.status).toBe(400);

        const res2 = await request(app)
            .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA")
            .set("Authorization", `Bearer ${token}`)
            .send({
                macAddress: "22:22:22:22:22:22",
                name: 1,
                description: "Descrizion GW01 UPD",
            });

        expect(res2.status).toBe(400);

        const res3 = await request(app)
            .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA")
            .set("Authorization", `Bearer ${token}`)
            .send({
                macAddress: "22:22:22:22:22:22",
                name: "GW01",
                description: 1,
            });

        expect(res3.status).toBe(400);
    })

    it("update gateway: not found errors", async() => {
        const res = await request(app)
            .patch("/api/v1/networks/NET07/gateways/AA:AA:AA:AA:AA:AA")
            .set("Authorization", `Bearer ${token}`)
            .send({
                macAddress: "00:11:22:33:44:66",
                name: "GW01 UPD",
                description: "Descrizion GW01 UPD",
            });

        expect(res.status).toBe(404);


        const res2 = await request(app)
            .patch("/api/v1/networks/NET01/gateways/11:11:11:11:11:11")
            .set("Authorization", `Bearer ${token}`)
            .send({
                macAddress: "00:11:22:33:44:66",
                name: "GW01 UPD",
                description: "Descrizion GW01 UPD",
            });

        expect(res2.status).toBe(404);

    })

    it("update gateway: conflict error", async () => {
        const res = await request(app)
            .patch("/api/v1/networks/NET01/gateways/AA:AA:AA:AA:AA:AA")
            .set("Authorization", `Bearer ${token}`)
            .send({
                macAddress: "BB:BB:BB:BB:BB:BB",
                name: "GW01 UPD",
                description: "Descrizione GW01 UPD",
            });

        expect(res.status).toBe(409);
    })
})