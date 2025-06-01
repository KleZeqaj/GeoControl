import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import {
  beforeAllE2e,
  afterAllE2e,
  TEST_USERS
} from "@test/e2e/acceptance/acceptance-lifecycle";
import * as constants from "@test/e2e/acceptance/constants";
import { UserType } from "@models/UserType";

describe("GET /users (e2e)", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("get all users", async () => {
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(constants.OK);
    expect(res.body.length).toBe(3);

    const usernames = res.body.map((u: any) => u.username).sort();
    const types = res.body.map((u: any) => u.type).sort();

    expect(usernames).toEqual(["admin", "operator", "viewer"]);
    expect(types).toEqual(["admin", "operator", "viewer"]);
  });
});

describe("POST /users (e2e)", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("create a user", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send(constants.USER1);

    expect(res.status).toBe(constants.CREATED);

    const get = await request(app)
      .get("/api/v1/users/" + constants.USER1.username)
      .set("Authorization", `Bearer ${token}`);

    expect(get.status).toBe(constants.OK);
    expect(get.body).toMatchObject({
      username: constants.USER1.username,
      type: constants.USER1.type
    });
  });
});

describe("GET /users/:username (e2e)", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("get a user", async () => {
    const get = await request(app)
      .get("/api/v1/users/" + "admin")
      .set("Authorization", `Bearer ${token}`);

    expect(get.status).toBe(constants.OK);
    expect(get.body).toMatchObject({ username: "admin", type: UserType.Admin });
  });
});

describe("DELETE /users (e2e)", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("delete a user", async () => {
    const res = await request(app)
      .delete("/api/v1/users/" + "viewer")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(constants.UPDATED_DELETED);

    const get = await request(app)
      .get("/api/v1/users/" + "viewer")
      .set("Authorization", `Bearer ${token}`);

    expect(get.status).toBe(constants.NOT_FOUND);
  });
});
