-- PostgreSQL schema: DUCA base + usuarios + bitácora
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  hash_bcrypt TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('ADMIN', 'TRANSPORTISTA', 'AGENTE')),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS importador (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  documento TEXT,
  pais TEXT
);

CREATE TABLE IF NOT EXISTS exportador (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  documento TEXT,
  pais TEXT
);

CREATE TABLE IF NOT EXISTS transporte (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medio TEXT,
  placa TEXT,
  conductor TEXT,
  ruta TEXT
);

CREATE TABLE IF NOT EXISTS duca (
  numero_documento TEXT PRIMARY KEY,
  fecha_emision DATE NOT NULL,
  pais_emisor TEXT NOT NULL,
  tipo_operacion TEXT,
  estado_documento TEXT NOT NULL CHECK (estado_documento IN
    ('PENDIENTE','EN_REVISION','VALIDADA','RECHAZADA','ANULADA')
  ),
  moneda TEXT,
  valor_aduana_total NUMERIC(18,2),
  resultado_selectivo TEXT,
  firma_electronica TEXT,

  importador_id UUID REFERENCES importador(id) ON DELETE SET NULL,
  exportador_id UUID REFERENCES exportador(id) ON DELETE SET NULL,
  transporte_id UUID REFERENCES transporte(id) ON DELETE SET NULL,

  transportista_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_duca_estado ON duca(estado_documento);
CREATE INDEX IF NOT EXISTS idx_duca_transportista ON duca(transportista_id);

CREATE TABLE IF NOT EXISTS mercancias_item (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_documento TEXT NOT NULL REFERENCES duca(numero_documento) ON DELETE CASCADE,
  item_no INTEGER NOT NULL,
  descripcion TEXT NOT NULL,
  cantidad NUMERIC(18,3) NOT NULL,
  unidad TEXT,
  valor NUMERIC(18,2),
  UNIQUE(numero_documento, item_no)
);

CREATE TABLE IF NOT EXISTS bitacora (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_origen INET,
  operacion TEXT NOT NULL,
  resultado TEXT,
  numero_documento TEXT REFERENCES duca(numero_documento) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_bitacora_numdoc ON bitacora(numero_documento);
CREATE INDEX IF NOT EXISTS idx_bitacora_usuario ON bitacora(usuario_id);
