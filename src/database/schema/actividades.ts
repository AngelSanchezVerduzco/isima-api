import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const actividades = sqliteTable('actividades', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  titulo: text('titulo').notNull(), // Ej: 'Examen', 'Tarea', 'Reunión', 'Otro'
  descripcion: text('descripcion'), // Descripción general del tipo de actividad
});

// Opcional: Puedes pre-cargar actividades por defecto en tu base de datos
// Ejemplos:
// { id: 1, titulo: 'Clase Teórica' }
// { id: 2, titulo: 'Clase Práctica' }
// { id: 3, titulo: 'Examen Parcial' }
// { id: 4, titulo: 'Entrega de Tarea' }
// { id: 5, titulo: 'Reunión' }
// { id: 6, titulo: 'Otro' } // Una entrada específica para 'Otro'
