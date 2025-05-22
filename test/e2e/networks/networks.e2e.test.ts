import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";

describe("GET /networks (e2e)", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("get all networks", async () => {
    const res = await request(app)
      .get("/api/v1/networks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);

    const codes = res.body.map((n: any) => n.code).sort();
    const names = res.body.map((n: any) => n.name).sort();

    expect(codes).toEqual(["NET01", "NET02", "NET03"]);
    expect(names).toEqual(["Network 1", "Network 2", "Network 3"]);
  });

  it("get all networks: invalid token", async () => {
    const res = await request(app).
    get("/api/v1/networks")
    .set("Authorization", `Bearer invalidtoken`);

    expect(res.status).toBe(401);
  });
});

describe("GET /networks/:networkCode (e2e)", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("get network by code", async () => {
    const res = await request(app)
      .get("/api/v1/networks/NET01")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.code).toBe("NET01");
    expect(res.body.name).toBe("Network 1");
  });

  it("get network by code: invalid token", async () => {
    const res = await request(app)
      .get("/api/v1/networks/NET01")
      .set("Authorization", `Bearer invalidtoken`);
    expect(res.status).toBe(401);
  });

  it("get network by code: not found", async () => {
    const res = await request(app)
      .get("/api/v1/networks/INVALID_CODE")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe("POST /networks (e2e)", () => {
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

  it("create network: admin", async () => {
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        code: "NET04",
        name: "Network 4",
        description: "Test Network 4"
      });

    expect(res.status).toBe(201);
  });

  it("create network: operator", async () => {
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${tokenOperator}`)
      .send({
        code: "NET05",
        name: "Network 5",
        description: "Test Network 5"
      });

    expect(res.status).toBe(201);
  });

  it("create network: viewer", async () => {
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${tokenViewer}`)
      .send({
        code: "NET06",
        name: "Network 6",
        description: "Test Network 6"
      });

    expect(res.status).toBe(403);
  });

  it("create network: invalid token", async () => {
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer invalidtoken`)
      .send({
        code: "NET07",
        name: "Network 7",
        description: "Test Network 7"
        });

    expect(res.status).toBe(401);
  });

  it("create network: missing fields", async () => {
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("create network: duplicate code", async () => {
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        code: "NET01",
        name: "Network 1",
        description: "Test Network 1"
      });

    expect(res.status).toBe(409);
  });
});



describe("PATCH /networks/:networkCode (e2e)", () => {
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

  it("update network: amdin", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/NET01")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        name: "Updated Network",
        description: "Updated Description"
      });

    expect(res.status).toBe(204);
  });

  it("update network: operator", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/NET01")
      .set("Authorization", `Bearer ${tokenOperator}`)
      .send({
        name: "Updated Network",
        description: "Updated Description"
      });

    expect(res.status).toBe(204);
  });

  it("update network: viewer", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/NET01")
      .set("Authorization", `Bearer ${tokenViewer}`)
      .send({
        name: "Updated Network",
        description: "Updated Description"
      });

    expect(res.status).toBe(403);
  });

  it("update network: invalid token", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/NET01")
      .set("Authorization", `Bearer invalidtoken`)
      .send({
        name: "Updated Network",
        description: "Updated Description"
      });

    expect(res.status).toBe(401);
  });

  it("update network: not found", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/INVALID_CODE")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        name: "Updated Network",
        description: "Updated Description"
      });

    expect(res.status).toBe(404);
  });

  it("update network: invalid data", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/NET01")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        code: 1
      });

    expect(res.status).toBe(400);
  });

  it("update network: duplicate code", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/NET01")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        code: "NET02",
        name: "Updated Network",
        description: "Updated Description"
      });

    expect(res.status).toBe(409);
  });
});

describe("DELETE /networks/:networkCode (e2e)", () => {
  let tokenAdmin: string;
  let tokenOperator: string;
  let tokenViewer: string;

  beforeAll(async () => {
    await beforeAllE2e();
    tokenAdmin = generateToken(TEST_USERS.admin);
    tokenOperator = generateToken(TEST_USERS.operator);
    tokenViewer = generateToken(TEST_USERS.viewer);
  }
  );
  afterAll(async () => {
    await afterAllE2e();
  });

  it("delete network: admin", async () => {
    const res = await request(app)
      .delete("/api/v1/networks/NET01")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(204);
  });

  it("delete network: operator", async () => {
    const res = await request(app)
      .delete("/api/v1/networks/NET02")
      .set("Authorization", `Bearer ${tokenOperator}`);

    expect(res.status).toBe(204);
  });

  it("delete network: viewer", async () => {
    const res = await request(app)
      .delete("/api/v1/networks/NET03")
      .set("Authorization", `Bearer ${tokenViewer}`);

    expect(res.status).toBe(403);
  });

  it("delete network: invalid token", async () => {
    const res = await request(app)
      .delete("/api/v1/networks/NET01")
      .set("Authorization", `Bearer invalidtoken`);
    expect(res.status).toBe(401);
  });

  it("delete network: not found", async () => {
    const res = await request(app)
      .delete("/api/v1/networks/INVALID_CODE")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(404);
  });



});