import { readdirSync } from "fs";
import path = require("path");

const DB_ENTITES_FOLDER = "../models/dao";
const DB_ENTITIES_PATH = path.join(__dirname, DB_ENTITES_FOLDER);
const DB_FILE_PATH = "../../data/database.sqlite";
const DB_PATH = path.resolve(__dirname, DB_FILE_PATH);
const APP_V1_BASE_URL = "/api/v1";
const URL_AUTH = "/auth";
const URL_USERS = "/users";
const URL_NETWORKS = "/networks";
const URL_GATEWAYS = "/:networkCode/gateways";
const URL_SENSORS = "/:gatewayMac/sensors";

export const TOKEN_LIFESPAN = "24h";
export const SECRET_KEY = "b}2ZzqQ!eQ!t7rFeT[GHs6FZ+*L]2VqR{vnLn>4-V3[5W-V{f^";
export const CONFIG = {
  APP_PORT: process.env.PORT || 5000,

  DB_TYPE: process.env.DB_TYPE || "sqlite",
  DB_HOST: process.env.DB_HOST || undefined,
  DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
  DB_USERNAME: process.env.DB_USERNAME || undefined,
  DB_PASSWORD: process.env.DB_PASSWORD || undefined,
  DB_NAME: process.env.DB_NAME || DB_PATH,

  DB_ENTITIES: readdirSync(DB_ENTITIES_PATH)
    .filter((file) => file.endsWith(".ts"))
    .map(
      (file) =>
        require(path.join(DB_ENTITIES_PATH, file))[
          Object.keys(require(path.join(DB_ENTITIES_PATH, file)))[0]
        ]
    ),
  SWAGGER_V1_FILE_PATH: path.resolve(__dirname, "../../doc/swagger_v1.yaml"),
  ROUTES: {
    V1_SWAGGER: APP_V1_BASE_URL + "/doc",
    V1_AUTH: APP_V1_BASE_URL + URL_AUTH,
    V1_USERS: APP_V1_BASE_URL + URL_USERS,
    V1_NETWORKS: APP_V1_BASE_URL + URL_NETWORKS,
    V1_GATEWAYS: APP_V1_BASE_URL + URL_NETWORKS + URL_GATEWAYS,
    V1_SENSORS: APP_V1_BASE_URL + URL_NETWORKS + URL_GATEWAYS + URL_SENSORS
  },
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  LOG_PATH: process.env.LOG_PATH || "logs",
  ERROR_LOG_FILE: process.env.ERROR_LOG_FILE || "error.log",
  COMBINED_LOG_FILE: process.env.COMBINED_LOG_FILE || "combined.log"
};
