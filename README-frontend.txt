# Frontend de Login (vanilla) para Aduanas DUCA

## Archivos
- `index.html` — pantalla de login simple y acciones posteriores (listar usuarios).
- `app.js` — lógica de autenticación: POST /auth/login, guarda JWT en localStorage y usa Authorization: Bearer.
- `styles.css` — estilos base.

En `app.js` cambia `BASE_URL` si tu servicio Render usa otra URL.

## Cómo integrarlo con tu backend existente
### Opción A: Servirlo desde el **mismo** servicio Node (recomendado)
1. Copia estos archivos a la carpeta `public/` de tu proyecto (créala si no existe).
2. En `src/server.js`, arriba de las rutas agrega:
   ```js
   import express from 'express';
   app.use(express.static('public'));
   ```
3. Redeploy en Render.
4. Abre `https://TU-SERVICIO.onrender.com/` y verás el login.

### Opción B: Deploy como **Static Site** en Render
1. Sube solo estos 3 archivos a un repo (carpeta raíz).
2. En Render, crea **Static Site** y apunta al repo. No necesitas build; el directorio raíz sirve.
3. En `app.js` edita `BASE_URL` para apuntar a tu API (`https://aduanas-duca-api.onrender.com`).

## Pruebas
- Usa `admin@demo.com` / `Admin123!` para entrar como ADMIN (si lo creaste).
- Luego en la sección de acciones, pulsa **Listar usuarios** para validar el token y el rol.
- Puedes extender el frontend para formularios de alta de usuarios/DUCA, etc.
