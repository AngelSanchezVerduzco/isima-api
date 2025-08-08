import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { grupos } from './grupos';

export const horarios = sqliteTable('horarios', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  grupoId: integer('grupo_id')
    .references(() => grupos.id)
    .notNull(),
  periodo: text('periodo').notNull(),
  activo: integer('activo', { mode: 'boolean' }).default(true),
});
