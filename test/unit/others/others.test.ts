import { getToken } from "@controllers/authController";
import { AppDataSource } from "@database";
import { UserDAO } from "@models/dao/UserDAO";
import { User as UserDTO } from "@models/dto/User";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { UserType } from "@models/UserType";
import { UserRepository } from "@repositories/UserRepository";
import * as utilController from "@utils";

jest.mock('@repositories/UserRepository', () => {
  return {
    UserRepository: jest.fn().mockImplementation(() => {
      return {
        getUserByUsername: jest.fn(),
      };
    }),
  };
});


beforeAll(async () => {
if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
}
});

afterAll(async () => {
if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
}
});

describe("test utils functions", () => {
    it("parse string array param", () => {
        // [" c ", 8, "zz "]
        const expected = ["c", "zz"];
        const ris = utilController.parseStringArrayParam([" c ", 8, "zz "])
        expect(ris).toMatchObject(expected);

        const expected2 = ["c", "zz"]
        const ris2 = utilController.parseStringArrayParam(" c,, zz")
        expect(ris2).toMatchObject(expected2);
    });

    it("parseISODateParamToUTC", () => {
        const ris = utilController.parseISODateParamToUTC(undefined);
        expect(ris).toBe(undefined);
    })    
})

describe("test auth functions", () => {
    it("getToken", async () => {
        const userD = new UserDAO();
        userD.username = "s123456";
        userD.password = "123456";
        userD.type = UserType.Operator;

        const user_dto : UserDTO = {
            username: userD.username,
            type: userD.type,
            password: userD.password
        }

        const MockedUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;
        const mockGetUserByUsername = jest.fn().mockResolvedValue(userD);
    
        MockedUserRepository.mockImplementation(() => ({
            getUserByUsername: mockGetUserByUsername,
        } as any));

        const token = await getToken(user_dto);
        expect(token.token.length).toBeGreaterThan(0); // se il token è stato generato correttamente la sua lunghezza
                                                       // dovrebbe essere maggiore di 0

        const user = {
            username: userD.username,
            type: userD.type,
            password: "provando"
        }

        await expect(getToken(user)).rejects.toThrow(UnauthorizedError); 
    })

})



