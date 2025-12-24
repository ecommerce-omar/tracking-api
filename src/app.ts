import express from "express";
import trackingRouter from "./routes/tracking";
import templatesRouter from "./routes/templates";
import { ErrorHandlerMiddleware } from "./infrastructure/middlewares/ErrorHandlerMiddleware";

const app = express();

// Middleware para parsing de JSON
app.use(express.json());

// Rotas da aplicação
app.use("/tracking", trackingRouter);
app.use("/templates", templatesRouter);

// IMPORTANTE: Middleware de erro deve vir DEPOIS das rotas
// Caso contrário, erros nas rotas não serão capturados
app.use(ErrorHandlerMiddleware.handle);

export default app;
