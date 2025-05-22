import type { Config } from "jest";
import { pathsToModuleNameMapper } from "ts-jest";
import tsconfig from "./tsconfig.json";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/models/**",
    "!src/config/**",
    "!src/database/connection.ts",
    "!test/**"
  ],
  coveragePathIgnorePatterns: [
    "<rootDir>/src/models/",
    "<rootDir>/src/services/loggingService.ts",
    "<rootDir>/src/config/",
    "<rootDir>/src/database/",
    "<rootDir>/test/"
  ],
  reporters:
    process.env.CI === "true"
      ? [
          "default",
          [
            "jest-junit",
            {
              outputDirectory: "reports/junit",
              outputName: "jest-results.xml"
            }
          ]
        ]
      : ["default"],
  moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
    prefix: "<rootDir>/src/"
  }),
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  maxWorkers: 1
};

export default config;
