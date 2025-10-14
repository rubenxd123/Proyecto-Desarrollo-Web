import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { query } from '../src/db.js';

// Usage: node tools/create-admin.js email=admin@demo.com pass=Admin123! nombre="Administrador"
const args = Object.fromEntries(process.argv.slice(2).map(x => x.split('=')));
const email = args.email;
const pass = args.pass;
const nombre = args.nombre || 'Admin';

if (!email || !pass) {
  console.error('Uso: node tools/create-admin.js email=... pass=... nombre="..."');
  process.exit(1);
}

const run = async () => {
  const exists = await query('SELECT 1 FROM usuarios WHERE correo=$1', [email]);
  if (exists.rowCount) {
    console.log('Ya existe:', email);
    process.exit(0);
  }
  const hash = await bcrypt.hash(pass, 10);
  const r = await query('INSERT INTO usuarios(nombre, correo, hash_bcrypt, rol) VALUES ($1,$2,$3,$4) RETURNING id, correo, rol', [nombre, email, hash, 'ADMIN']);
  console.log('Creado:', r.rows[0]);
};

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
