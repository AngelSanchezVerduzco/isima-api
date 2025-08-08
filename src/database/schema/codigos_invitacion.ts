import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { grupos } from './grupos';
import { usuarios } from './usuarios';

export const codigos_invitacion = sqliteTable('codigos_invitacion', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  codigo: text('codigo').notNull().unique(),
  grupo_id: integer('grupo_id')
    .references(() => grupos.id)
    .notNull(),
  creado_por: integer('creado_por')
    .references(() => usuarios.id)
    .notNull(),
  fecha_creacion: text('fecha_creacion').default(sql`CURRENT_TIMESTAMP`),
  fecha_expiracion: text('fecha_expiracion').notNull(),
  activo: integer('activo', { mode: 'boolean' }).default(true),
  usos: integer('usos').default(0),
  max_usos: integer('max_usos'), // null significa usos ilimitados
});
