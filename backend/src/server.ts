import "dotenv/config";
import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";
import cuentasRoutes from "./routes/cuentas.routes";
import categoriasRoutes from "./routes/categorias.routes";
import transaccionesRoutes from "./routes/transacciones.routes";
import ordenesPermanentesRoutes from "./routes/ordenesPermanentes.routes";
import deudasRoutes from "./routes/deudas.routes";
import transaccionesProgramadasRoutes from "./routes/transaccionesProgramadas.routes";
import reportesRoutes from "./routes/reportes.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import { iniciarEjecucionTransaccionesProgramadas } from "./jobs/ejecutarTransaccionesProgramadas";
import { iniciarKeepAlive } from "./jobs/keepAlive";

const app = express();

const origenesPermitidos = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map((o) => o.trim());
app.use(cors({ origin: origenesPermitidos }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ estado: "ok" });
});

app.use("/api/cuentas", cuentasRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/transacciones", transaccionesRoutes);
app.use("/api/ordenes-permanentes", ordenesPermanentesRoutes);
app.use("/api/deudas", deudasRoutes);
app.use("/api/transacciones-programadas", transaccionesProgramadasRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`API de finanzas-app escuchando en http://localhost:${PORT}`);
  iniciarEjecucionTransaccionesProgramadas();
  iniciarKeepAlive();
});
