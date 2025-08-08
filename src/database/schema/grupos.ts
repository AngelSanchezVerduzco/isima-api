import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

export const grupos = sqliteTable('grupos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  semestre: integer('semestre').notNull(),
  turno: text('turno', { enum: ['matutino', 'vespertino'] }).notNull(),
  anio_escolar: text('anio_escolar').notNull(),
  estado: text('estado', { enum: ['activo', 'inactivo'] })
    .notNull()
    .default('activo'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
});
