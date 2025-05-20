import { GatewayDAO } from "@models/dao/GatewayDAO";
import { NetworkDAO } from "@models/dao/NetworkDAO";
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
            undefined,   
            "Post",
            undefined  
        );
        
        
    })



});