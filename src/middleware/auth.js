// src/middleware/auth.js
import jwt from 'jsonwebtoken'

export function requireAuth(roles = []) {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || ''
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null

      if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' })
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // si especificas roles, verifica
      if (roles.length > 0 && !roles.includes(decoded.rol)) {
        return res.status(403).json({ error: 'Acceso denegado' })
      }

      // guarda info del usuario para uso posterior
      req.user = decoded
      next()
    } catch (err) {
      console.error('Auth error:', err.message)
      return res.status(401).json({ error: 'Token inválido o expirado' })
    }
  }
}
