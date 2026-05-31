-- Ejecutar en Supabase SQL Editor
alter table configuracion_agencia
  add column if not exists idioma_ui text default 'es',
  add column if not exists resumen_auto_abrir boolean default true;

comment on column configuracion_agencia.idioma_ui is 'es | en — UI y auditorías IA nuevas';
comment on column configuracion_agencia.resumen_auto_abrir is 'Abrir panel resumen al completar auditoría';
