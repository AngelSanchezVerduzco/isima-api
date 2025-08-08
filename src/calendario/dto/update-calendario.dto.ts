export class UpdateCalendarioDto {
  titulo?: string; // Hacer opcionales si no siempre se actualizan
  descripcion?: string; // Hacer opcionales
  fechaInicio?: string; // Usar string 'YYYY-MM-DD' según comentario en servicio
  fechaFin?: string; // Usar string 'YYYY-MM-DD' según comentario en servicio
  horaInicio?: string; // Añadir, usar string 'HH:mm'
  horaFin?: string; // Añadir, usar string 'HH:mm'
  fechaHoraNotificacion?: string | Date | null; // Añadir, permitir string, Date o null
  actividadId?: number | null; // Añadir si se puede actualizar
  grupoId?: number | null; // Añadir si se puede actualizar
  paraTodosLosGrupos?: boolean; // Añadir si se puede actualizar
  requiereNotificacion?: boolean; // Añadir si se puede actualizar
}
