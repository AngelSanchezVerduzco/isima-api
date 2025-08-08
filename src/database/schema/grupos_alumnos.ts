import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { grupos } from './grupos';
import { alumnos } from './alumnos';

export const grupos_alumnos = sqliteTable('grupos_alumnos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  grupo_id: integer('grupo_id').references(() => grupos.id),
  alumno_id: integer('alumno_id').references(() => alumnos.id),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
