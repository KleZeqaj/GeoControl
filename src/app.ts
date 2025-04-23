import express from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { CONFIG } from "@config";
import { errorHandler } from "@middlewares/errorMiddleware";
import authenticationRouter from "@routes/authenticationRoutes";
import userRouter from "@routes/userRoutes";
import gatewayRouter from "@routes/gatewayRoutes";
import sensorRouter from "@routes/sensorRoutes";
import measurementRouter from "@routes/measurementRoutes";
import networkRouter from "@routes/networkRoutes";
import cors from "cors";

export const app = express();

app.use(express.json());
app.use(cors());

app.use(
  CONFIG.ROUTES.V1_SWAGGER,
  swaggerUi.serve,
  swaggerUi.setup(YAML.load(CONFIG.SWAGGER_V1_FILE_PATH))
);

app.use(CONFIG.ROUTES.V1_AUTH, authenticationRouter);
app.use(CONFIG.ROUTES.V1_USERS, userRouter);
app.use(CONFIG.ROUTES.V1_NETWORKS, networkRouter);
app.use(CONFIG.ROUTES.V1_GATEWAYS, gatewayRouter);
app.use(CONFIG.ROUTES.V1_SENSORS, sensorRouter);
app.use(measurementRouter);

//This must always be the last middleware added
app.use(errorHandler);
