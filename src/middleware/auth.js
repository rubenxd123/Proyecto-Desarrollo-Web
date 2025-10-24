// src/middleware/auth.js
export function requireAuth(req, res, next) {
  // Middleware mínimo: si envías Authorization: Bearer <token> pasa; si no, también (modo demo)
  // Cambia esta lógica cuando implementes auth real.
  const hdr = req.headers.authorization || "";
  if (hdr.startsWith("Bearer ")) return next();
  // En modo demo no bloqueamos:
  return next();
}
