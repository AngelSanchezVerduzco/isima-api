import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const salones = sqliteTable('salones', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  capacidad: integer('capacidad'),
  edificio: text('edificio'),
  disponible: integer('disponible', { mode: 'boolean' }).default(true),
});
