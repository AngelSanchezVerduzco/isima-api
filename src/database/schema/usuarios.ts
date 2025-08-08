import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

export const usuarios = sqliteTable('usuarios', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  apellidoP: text('apellidoP').notNull(),
  apellidoM: text('apellidoM').notNull(),
  correo: text('correo').notNull().unique(),
  contraseña: text('contraseña').notNull(),
  rol: text('rol', { enum: ['docente', 'alumno', 'administrativo'] }).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
