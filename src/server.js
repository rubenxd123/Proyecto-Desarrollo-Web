// src/server.js (fragmento)
import express from "express";
import cors from "cors";
import morgan from "morgan";

import validacionRoutes from "./routes/validacion.js";
import estadosRoutes from "./routes/estados.js";
import ducaRoutes from "./routes/duca.js"; // ⬅️ nuevo

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Rutas
app.use("/validacion", validacionRoutes);
app.use("/estados", estadosRoutes);
app.use("/duca", ducaRoutes); // ⬅️ nuevo

// ...
