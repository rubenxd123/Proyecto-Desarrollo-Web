// src/middleware/auth.js
import jwt from 'jsonwebtoken'

export function requireAuth(roles = []) {
  return (req, res, next) => {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return res.status(401).json({ error: 'No token' })

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      req.user = payload
      if (roles.length && !roles.includes(payload.rol)) {
        return res.status(403).json({ error: 'Rol no autorizado' })
      }
      next()
    } catch {
      return res.status(401).json({ error: 'Token inválido' })
    }
  }
}
