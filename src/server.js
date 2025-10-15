import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // 👈 agregado

import authRouter from './routes/auth.js';
import usuariosRouter from './routes/usuarios.js';
import ducaRouter from './routes/duca.js';
import validacionRouter from './routes/validacion.js';
import estadosRouter from './routes/estados.js';

dotenv.config();
const app = express();

// ============================================================
// 🔹 CONFIGURAR CORS (permite que el frontend haga peticiones)
// ============================================================
const allowedOrigins = [
  'https://frontend-proyecto-0hk1.onrender.com', // ⚡ tu frontend React en Render
  /\.onrender\.com$/ // opcional: cualquier dominio *.onrender.com
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// responder preflight requests
app.options('*', cors());

// ============================================================
// 🔹 Middleware base
// ============================================================
app.use(express.json());

// ============================================================
// 🔹 Rutas principales
// ============================================================
app.get('/', (_req, res) => res.json({ ok: true, service: 'aduanas-duca-api' }));

app.use('/auth', authRouter);
app.use('/usuarios', usuariosRouter);
app.use('/duca', ducaRouter);
app.use('/validacion', validacionRouter);
app.use('/estados', estadosRouter);

// ============================================================
// 🔹 Iniciar servidor
// ============================================================
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on :${port}`));
