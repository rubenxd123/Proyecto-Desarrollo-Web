import express from 'express';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import usuariosRouter from './routes/usuarios.js';
import ducaRouter from './routes/duca.js';
import validacionRouter from './routes/validacion.js';
import estadosRouter from './routes/estados.js';

dotenv.config();
const app = express();
app.use(express.json());

app.get('/', (_req, res) => res.json({ ok: true, service: 'aduanas-duca-api' }));

app.use('/auth', authRouter);
app.use('/usuarios', usuariosRouter);
app.use('/duca', ducaRouter);
app.use('/validacion', validacionRouter);
app.use('/estados', estadosRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on :${port}`));
