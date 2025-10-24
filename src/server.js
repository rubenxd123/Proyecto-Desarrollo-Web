import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRouter from './routes/auth.js'
import ducaRouter from './routes/duca.js'
import estadosRouter from './routes/estados.js'

dotenv.config()
const app = express()

const allowedOrigins = [
  'https://frontend-proyecto-0hk1.onrender.com',
]
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true)
    const ok = allowedOrigins.includes(origin)
    cb(ok ? null : new Error('CORS blocked'))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.options('*', cors())

app.use(express.json())

app.get('/', (_req, res) => res.json({ ok: true, service: 'aduanas-duca-api' }))

app.use('/auth', authRouter)
app.use('/duca', ducaRouter)
app.use('/estados', estadosRouter)

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`API listening on :${port}`))
