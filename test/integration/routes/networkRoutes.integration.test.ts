import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as networkController from "@controllers/networkController";
import { UserType } from "@models/UserType";
import { Network as NetworkDTO } from "@dto/Network";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";

jest.mock("@services/authService");
jest.mock("@controllers/networkController");

describe("NetworkRoutes integration", () => {
  const token = "Bearer faketoken";

  afterEach(() => {
    jest.clearAllMocks();
  });

/*----------------- Get network by code tests -----------------*/
  it("get network by code", async () => {
    const mockNetwork: NetworkDTO = {
      code: "NET01",
      name: "Network 1",
      description: "Description 1"
    };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.getNetworkByCode as jest.Mock).mockResolvedValue(mockNetwork);

    const response = await request(app)
      .get("/api/v1/networks/NET01")
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockNetwork);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin, UserType.Operator, UserType.Viewer
    ]);
    expect(networkController.getNetworkByCode).toHaveBeenCalledWith("NET01");
  });

  it("get network by code: error handling", async () => {
  (authService.processToken as jest.Mock).mockResolvedValue(undefined);
  const fakeError = new Error("Generic get error");
  (networkController.getNetworkByCode as jest.Mock).mockRejectedValue(fakeError);

  const response = await request(app)
    .get("/api/v1/networks/NET01")
    .set("Authorization", token);

  expect(response.status).toBe(500);
  expect(response.body.message).toMatch(/Generic get error/);
});

/*----------------- Get network all networks tests -----------------*/
  it("get all networks", async () => {
    const mockNetworks: NetworkDTO[] = [
      { code: "NET01", name: "Network 1", description: "Description 1" },
      { code: "NET02", name: "Network 2", description: "Description 2" }
    ];


    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.getAllNetworks as jest.Mock).mockResolvedValue(mockNetworks);

    const response = await request(app)
      .get("/api/v1/networks")
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockNetworks);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin, UserType.Operator, UserType.Viewer
    ]);
    expect(networkController.getAllNetworks).toHaveBeenCalled();
  });

  it("get all networks: error handling", async () => {
  (authService.processToken as jest.Mock).mockResolvedValue(undefined);
  const fakeError = new Error("Database failure");
  (networkController.getAllNetworks as jest.Mock).mockRejectedValue(fakeError);

  const response = await request(app)
    .get("/api/v1/networks")
    .set("Authorization", token);

  expect(response.status).toBe(500);
  expect(response.body.message).toMatch(/Database failure/);
});

  it("get all networks: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token provided");
    });

    const response = await request(app)
      .get("/api/v1/users")
      .set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

/*----------------- Create network tests -----------------*/
  it("create network", async () => {
    const mockNetwork: NetworkDTO = {
      code: "NET01",
      name: "Network 1",
      description: "Description 1"
    };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.createNewNetwork as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", token)
      .send(mockNetwork);

    expect(response.status).toBe(201);
    expect(networkController.createNewNetwork).toHaveBeenCalledWith(mockNetwork);
  });

  it("create network: error handling", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    const fakeError = new Error("Create failed");
    (networkController.createNewNetwork as jest.Mock).mockRejectedValue(fakeError);

    const mockNetwork: NetworkDTO = {
      code: "NET01",
      name: "Network 1",
      description: "Description 1"
    };

    const response = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", token)
      .send(mockNetwork);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/Create failed/);
  });

  it("create network: 403 InsufficientRightsError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden: Insufficient rights");
    });

    const response = await request(app)
      .get("/api/v1/users")
      .set("Authorization", token);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Insufficient rights/);
  });

/*----------------- Update network tests -----------------*/
  it("update network", async () => {
    const mockNetwork: NetworkDTO = {
      code: "NET01",
      name: "Network 1",
      description: "Description 1"
    };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.updateNetwork as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .patch("/api/v1/networks/NET01")
      .set("Authorization", token)
      .send(mockNetwork);

    expect(response.status).toBe(204);
    expect(networkController.updateNetwork).toHaveBeenCalledWith("NET01", mockNetwork);
  });


  it("update network: error handling", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    const fakeError = new Error("Update failed");
    (networkController.updateNetwork as jest.Mock).mockRejectedValue(fakeError);

    const mockNetwork: NetworkDTO = {
      code: "NET01",
      name: "Network 1",
      description: "Description 1"
    };

    const response = await request(app)
      .patch("/api/v1/networks/NET01")
      .set("Authorization", token)
      .send(mockNetwork);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/Update failed/);
  });

/*----------------- Delete network tests -----------------*/
  it("delete network", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.deleteNetwork as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .delete("/api/v1/networks/NET01")
      .set("Authorization", token);

    expect(response.status).toBe(204);
    expect(networkController.deleteNetwork).toHaveBeenCalledWith("NET01");
  });

  it("delete network: error handling", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    const fakeError = new Error("Delete failed");
    (networkController.deleteNetwork as jest.Mock).mockRejectedValue(fakeError);

    const response = await request(app)
      .delete("/api/v1/networks/NET01")
      .set("Authorization", token);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/Delete failed/);
  });
});
