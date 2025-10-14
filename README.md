# Sistema de Declaraciones (DUCA) — API Base (Render Ready)

Este repositorio contiene una API mínima en **Node.js + Express** con **PostgreSQL** para gestionar:
- Autenticación JWT (CU-01)
- Gestión de usuarios (CU-02, rol ADMIN)
- Registro de declaración DUCA (CU-03, rol TRANSPORTISTA)
- Validación de declaración (CU-04, rol AGENTE)
- Consulta de estados (CU-05)

## Despliegue rápido en Render
1. **Sube este repo a GitHub**.
2. En Render, usa **Blueprint** con `render.yaml`.
3. Render creará automáticamente:
   - Un **servicio web** Node
   - Una **BD PostgreSQL** gestionada
4. Variables de entorno:
   - `DATABASE_URL` (Render la inyecta desde el addon)
   - `JWT_SECRET` (defínela tú)
   - `NODE_ENV=production`
5. Ejecuta la inicialización de BD:
   ```bash
   psql "$DATABASE_URL" -f db/schema.sql
   ```
6. Crea un admin:
   ```bash
   node tools/create-admin.js email=admin@demo.com pass=Admin123! nombre="Administrador"
   ```

## OpenAPI
- Archivo `openapi.yaml` en la raíz.

## ERD
- `docs/ERD.md` con Mermaid (GitHub lo renderiza).
