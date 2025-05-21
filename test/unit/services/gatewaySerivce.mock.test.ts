import { BadRequestError } from "@errors/BadRequestError";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { createGatewayService, updateGatewayService } from "@services/gatewayService";

jest.mock("@repositories/GatewayRepository");

const createGatewayMock = jest.fn();
const isMacAlreadyPresentMock = jest.fn();
const getGatewayByMacAddressMock = jest.fn();
const updateGatewayMock = jest.fn();

(GatewayRepository as jest.Mock).mockImplementation(() => ({
    createGateway: createGatewayMock,
    isMacAlreadyPresent: isMacAlreadyPresentMock,
    getGatewayByMacAddress: getGatewayByMacAddressMock,
    updateGateway: updateGatewayMock,
}));


const mockNetwork = new NetworkDAO();
mockNetwork.code = "NET01"

describe("GatewayService", () => {

    beforeAll(() => {
        jest.clearAllMocks();
    });

    it("throws an error if MAC address is invalid", async () => {
      await expect(createGatewayService("-mac-", "GW01", "prova", mockNetwork))
        .rejects
        .toThrow("MAC Address format is not valid");
    });

    it("should not return errors", async () => {
      const fakeGateway = new GatewayDAO();
      fakeGateway.macAddress = "AA:BB:CC:DD:EE:FF";
      fakeGateway.name = "GW01";
      fakeGateway.description = "prova";

    
      createGatewayMock.mockResolvedValue(fakeGateway);

      const result = await createGatewayService("AA:BB:CC:DD:EE:FF", "GW01", "prova", mockNetwork);

      expect(isMacAlreadyPresentMock).toHaveBeenCalledWith("AA:BB:CC:DD:EE:FF");
      expect(createGatewayMock).toHaveBeenCalledWith("AA:BB:CC:DD:EE:FF", "GW01", "prova", mockNetwork);
      expect(result).toBe(fakeGateway);
    });

    
    it("update with undefiend values", async () => {
        const gateway = new GatewayDAO();
        gateway.macAddress = "AA:BB:CC:DD:EE:FF";
        gateway.name = "GW01";
        gateway.description = "desc";

        getGatewayByMacAddressMock.mockResolvedValue(gateway);

        const providedGateway = new GatewayDAO();
        providedGateway.macAddress = undefined;
        providedGateway.name = "Prova";
        providedGateway.description = undefined;

        const expectedUpdatedGateway = new GatewayDAO();
        expectedUpdatedGateway.macAddress = "AA:BB:CC:DD:EE:FF";
        expectedUpdatedGateway.name = "Prova";
        expectedUpdatedGateway.description = "desc";

        await updateGatewayService("NET01", "AA:BB:CC:DD:EE:FF", providedGateway);

        expect(updateGatewayMock).toHaveBeenCalledWith(
            "NET01",
            "AA:BB:CC:DD:EE:FF",
            "AA:BB:CC:DD:EE:FF", 
            "Prova",
            "desc"
        );
    })

    it("invalid mac -> should throw Error", async () => {
        const gateway = new GatewayDAO();
        gateway.macAddress = "AA:BB:CC:DD:EE:FF";
        gateway.name = "GW01";
        gateway.description = "desc";

        getGatewayByMacAddressMock.mockResolvedValue(gateway);

        const providedGateway = new GatewayDAO();
        providedGateway.macAddress = "";
        providedGateway.name = "Prova";
        providedGateway.description = undefined;

        await expect(updateGatewayService("NET01", "AA:BB:CC:DD:EE:FF", providedGateway)
        ).rejects.toThrow(BadRequestError)
    })

    it("new macAddress already present update -> should throw ConflictError", async () => {
        const gateway1 = new GatewayDAO();
        gateway1.macAddress = "AA:BB:CC:DD:EE:FF";
        gateway1.name = "GW01";
        gateway1.description = "desc";

        const gateway2 = new GatewayDAO();
        gateway2.macAddress = "BB:CC:DD:EE:FF:99";
        gateway2.name = "Prova";
        gateway2.description = "desc desc";

        getGatewayByMacAddressMock.mockResolvedValue(gateway1);
        isMacAlreadyPresentMock.mockImplementation(async () => {
            throw new ConflictError("Gateway with MAC address BB:CC:DD:EE:FF:99 already exists");
        }); 

        const providedGateway = new GatewayDAO();
        providedGateway.macAddress = "BB:CC:DD:EE:FF:99";
        providedGateway.name = "Prova";
        providedGateway.description = undefined;

        await expect(
            updateGatewayService("NET01", "AA:BB:CC:DD:EE:FF", providedGateway)
        ).rejects.toMatchObject({
            message: "Gateway with MAC address BB:CC:DD:EE:FF:99 already exists"
        });
    })



});