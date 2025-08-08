import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { horarios } from './horarios';
import { salones } from './salones';

export const horarioSalones = sqliteTable('horario_salones', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  horario_id: integer('horario_id')
    .references(() => horarios.id)
    .notNull(),
  salon_id: integer('salon_id')
    .references(() => salones.id)
    .notNull(),
  fecha_inicio: text('fecha_inicio').notNull(), // Fecha desde cuando aplica este salón
  fecha_fin: text('fecha_fin'), // Fecha hasta cuando aplica (null si es indefinido)
  motivo: text('motivo'), // Razón del cambio de salón
  estado: text('estado', { enum: ['activo', 'inactivo'] })
    .notNull()
    .default('activo'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
