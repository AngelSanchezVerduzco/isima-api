import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { calendario } from './calendario'; // Asegúrate de que la ruta sea correcta
import { usuarios } from './usuarios'; // Asegúrate de que la ruta sea correcta y el archivo exista
import { grupos } from './grupos'; // Asegúrate de que la ruta sea correcta y el archivo exista
import { sql } from 'drizzle-orm'; // Importa sql para valores por defecto

export const notificaciones = sqliteTable('notificaciones', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  calendarioId: integer('calendario_id')
    .references(() => calendario.id)
    .notNull(), // Vincula a la entrada del calendario

  tipo: text('tipo').$type<'gmail' | 'push' | 'in-app'>().notNull(), // Tipo de notificación

  remitenteUsuarioId: integer('remitente_usuario_id').references(() => usuarios.id), // Quién "envía" (el que creó el evento)

  // Destinatarios (puede ser un usuario específico o un grupo)
  destinatarioUsuarioId: integer('destinatario_usuario_id').references(() => usuarios.id), // Si es para un usuario específico
  destinatarioGrupoId: integer('destinatario_grupo_id').references(() => grupos.id), // Si es para un grupo

  estado: text('estado')
    .$type<'pendiente' | 'enviada' | 'fallida'>()
    .default('pendiente')
    .notNull(),

  fechaCreacion: integer('fecha_creacion', { mode: 'timestamp' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  fechaEnvio: integer('fecha_envio', { mode: 'timestamp' }), // Cuando se envió realmente

  // Campos para el contenido de la notificación (pueden venir del calendario/actividad)
  titulo: text('titulo').notNull(),
  cuerpo: text('cuerpo'),
});
