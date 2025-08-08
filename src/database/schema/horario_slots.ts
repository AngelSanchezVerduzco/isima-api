import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { horarios } from './horarios';
import { salones } from './salones';
import { docenteGrupos } from './docente-grupos';

export const horarioSlots = sqliteTable('horario_slots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  horarioId: integer('horario_id')
    .references(() => horarios.id)
    .notNull(),
  dia: text('dia').notNull(),
  horaInicio: text('hora_inicio').notNull(),
  horaFin: text('hora_fin').notNull(),
  salonId: integer('salon_id')
    .references(() => salones.id)
    .notNull(),
  docenteGrupoId: integer('docente_grupo_id').references(() => docenteGrupos.id),
  materia: text('materia').notNull(),
});
