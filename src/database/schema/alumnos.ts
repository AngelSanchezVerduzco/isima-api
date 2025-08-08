import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { usuarios } from './usuarios';
export const alumnos = sqliteTable('alumnos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  usuario_id: integer('usuario_id')
    .references(() => usuarios.id)
    .notNull(),
  matricula: text('matricula').notNull().unique(),
  estado: text('estado', { enum: ['activo', 'inactivo'] })
    .notNull()
    .default('activo'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
