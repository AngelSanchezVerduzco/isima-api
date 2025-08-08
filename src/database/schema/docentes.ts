import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { usuarios } from './usuarios';

export const docentes = sqliteTable('docentes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  usuario_id: integer('usuario_id').references(() => usuarios.id),
  especialidad: text('especialidad'),
  cedula: text('cedula').unique(),
  titulo: text('titulo'),
});
