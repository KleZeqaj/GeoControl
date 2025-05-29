import { app } from "@app";
import * as userController from "@controllers/userController";
import { UserDAO } from "@models/dao/UserDAO";
import { UserType } from "@models/UserType";
import { UserRepository } from "@repositories/UserRepository";
import { generateToken } from "@services/authService";
import { afterAllE2e, beforeAllE2e, TEST_USERS } from "@test/e2e/lifecycle";
import request from "supertest";

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

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(3);

        const usernames = res.body.map((u: any) => u.username).sort();
        const types = res.body.map((u: any) => u.type).sort();

        expect(usernames).toEqual(["admin", "operator", "viewer"]);
        expect(types).toEqual(["admin", "operator", "viewer"]);
    });

    it("get all users: 401 unauthorized", async () => {
        const res = await request(app)
        .get("/api/v1/users")
        .set("Authorization", `Bearer`);

        expect(res.status).toBe(401);
        expect(res.body.name).toEqual("UnauthorizedError");
    })

    it("get all users: 403 Insufficient Rights", async () => {
        const res = await request(app)
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${generateToken(TEST_USERS.operator)}`);

        expect(res.status).toBe(403);
        expect(res.body.name).toEqual("InsufficientRightsError");
    })

    it("get all users: 500 Error", async () => {
   
        const mock = jest.spyOn(userController, "getAllUsers").mockImplementationOnce(() => {
            throw new Error("Database error");
        });

        const res = await request(app)
            .get("/api/v1/users")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(500); 
        expect(res.body.name).toBe("InternalServerError"); 
        mock.mockRestore();
    })
});


describe("GET /users/{userName}", () => {
    let token: string;

    beforeAll(async () => {
        await beforeAllE2e();
        token = generateToken(TEST_USERS.admin);
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    it("get a specfic user", async () => {
        const res = await request(app)
            .get("/api/v1/users/admin")
            .set("Authorization", `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            username: "admin",
            type: UserType.Admin
        })
    });

    it("get a specific user: 401 unauthorized", async () => {
        const res = await request(app)
        .get("/api/v1/users/admin")
        .set("Authorization", `Bearer`);

        expect(res.status).toBe(401);
        expect(res.body.name).toEqual("UnauthorizedError");
    })

    it("get a specific user: 403 Insufficient Rights", async () => {
        const res = await request(app)
        .get("/api/v1/users/admin")
        .set("Authorization", `Bearer ${generateToken(TEST_USERS.operator)}`);

        expect(res.status).toBe(403);
        expect(res.body.name).toEqual("InsufficientRightsError");
    })

    it("get a specific user: 404 NotFound Error", async () => {
        const res = await request(app)
        .get("/api/v1/users/admi")
        .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body.name).toEqual("NotFoundError");
    })

})


describe("DELETE /users/{userName}", () => {
    let token: string;

    beforeAll(async () => {
        await beforeAllE2e();
        token = generateToken(TEST_USERS.admin);
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    it("delete a specfic user", async () => {
        const userRepo = new UserRepository();

        const res = await request(app)
            .delete("/api/v1/users/viewer")
            .set("Authorization", `Bearer ${token}`);
        
        expect(res.status).toBe(204);
        expect((await userRepo.getAllUsers()).length).toBe(2);
    })

    it("delete a user: 401 unauthorized", async () => {
        const res = await request(app)
        .delete("/api/v1/users/admin")
        .set("Authorization", `Bearer`);

        expect(res.status).toBe(401);
        expect(res.body.name).toEqual("UnauthorizedError");
    })

    it("delete a user: 403 Insufficient Rights", async () => {
        const res = await request(app)
        .delete("/api/v1/users/admin")
        .set("Authorization", `Bearer ${generateToken(TEST_USERS.operator)}`);

        expect(res.status).toBe(403);
        expect(res.body.name).toEqual("InsufficientRightsError");
    })

    it("delete a user: 404 NotFound Error", async () => {
        const res = await request(app)
        .delete("/api/v1/users/admi")
        .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body.name).toEqual("NotFoundError");
    })
})


describe("POST /users", () => {
    let token: string;

    beforeAll(async () => {
        await beforeAllE2e();
        token = generateToken(TEST_USERS.admin);
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    it("create a new user", async () => {
        const userRepo = new UserRepository();
        const user = new UserDAO();
        user.username = "s123456";
        user.password = "12345";
        user.type = UserType.Operator; 

        const res = await request(app)
            .post("/api/v1/users")
            .set("Authorization", `Bearer ${token}`)
            .send(user);
        
        expect(res.status).toBe(201);
        expect((await userRepo.getAllUsers()).length).toBe(4);
        expect(await userRepo.getUserByUsername("s123456")).toMatchObject({
            username: "s123456",
            type: UserType.Operator
        })
    })

    it("create a new user: 401 unauthorized", async () => {
        const user = new UserDAO();
        user.username = "s123456";
        user.password = "12345";
        user.type = UserType.Operator; 

        const res = await request(app)
        .post("/api/v1/users")
        .set("Authorization", `Bearer`)
        .send(user);

        expect(res.status).toBe(401);
        expect(res.body.name).toEqual("UnauthorizedError");
    })

    it("create a new user: 401 unauthorized", async () => {
        const user = new UserDAO();
        user.username = "s123456";
        user.password = "12345";
        user.type = UserType.Operator; 

        const res = await request(app)
        .post("/api/v1/users")
        .set("Authorization", `Bearer ${generateToken(TEST_USERS.operator)}`)
        .send(user);

        expect(res.status).toBe(403);
        expect(res.body.name).toEqual("InsufficientRightsError");
    })

    it("create a new user: 409 Conflict Error", async () => {
        const user = new UserDAO();
        user.username = "admin";
        user.password = "12345";
        user.type = UserType.Operator; 

        const res = await request(app)
        .post("/api/v1/users")
        .set("Authorization", `Bearer ${token}`)
        .send(user);

        expect(res.status).toBe(409);
        expect(res.body.name).toEqual("ConflictError");
    })
})

