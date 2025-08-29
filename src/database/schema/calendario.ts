import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { actividades } from './actividades'; // Asegúrate de que la ruta sea correcta
import { grupos } from './grupos'; // Asegúrate de que la ruta sea correcta y el archivo exista
import { usuarios } from './usuarios'; // Asegúrate de que la ruta sea correcta y el archivo exista
import { salones } from './salones'; // Importar salones para la referencia

export const calendario = sqliteTable('calendario', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  titulo: text('titulo').notNull(), // Título del evento (puede ser de la actividad o personalizado)
  descripcion: text('descripcion'), // Descripción del evento (puede ser de la actividad o personalizada)

  actividadId: integer('actividad_id').references(() => actividades.id), // Opcional: vincula a una actividad predefinida

  // Información de tiempo y fecha del evento en el calendario
  fechaInicio: text('fecha_inicio').notNull(), // Formato YYYY-MM-DD
  fechaFin: text('fecha_fin').notNull(), // Formato YYYY-MM-DD
  horaInicio: text('hora_inicio').notNull(), // Formato HH:mm
  horaFin: text('hora_fin').notNull(), // Formato HH:mm

  // Información del asignador
  asignadoPorUsuarioId: integer('asignado_por_usuario_id')
    .references(() => usuarios.id)
    .notNull(),

  // Información de a quién va dirigido
  grupoId: integer('grupo_id').references(() => grupos.id), // Opcional: si es para un grupo específico
  paraTodosLosGrupos: integer('para_todos_los_grupos', { mode: 'boolean' })
    .notNull()
    .default(false), // Si es para todos los grupos del usuario/admin

  // Información del salón
  salonId: integer('salon_id').references(() => salones.id), // Opcional: salón asignado al evento

  // Configuración de Notificación
  requiereNotificacion: integer('requiere_notificacion', { mode: 'boolean' }).default(false),
  fechaHoraNotificacion: integer('fecha_hora_notificacion', { mode: 'timestamp' }), // Cuándo enviar la notificación (timestamp)
});
