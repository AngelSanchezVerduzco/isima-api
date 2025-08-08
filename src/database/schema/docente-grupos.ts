import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { usuarios } from './usuarios';
import { grupos } from './grupos';

export const docenteGrupos = sqliteTable('docente_grupos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  docenteId: integer('docente_id')
    .references(() => usuarios.id)
    .notNull(),
  grupoId: integer('grupo_id')
    .references(() => grupos.id)
    .notNull(),
  materia: text('materia').notNull(), // Qué materia imparte el docente en este grupo
  estado: text('estado', {
    enum: ['activo', 'inactivo', 'suspendido'],
  })
    .notNull()
    .default('activo'),
  periodo: text('periodo').notNull(), // Ejemplo: "2024-1", "2024-2"
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
