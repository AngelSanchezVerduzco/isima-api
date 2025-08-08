export class CreateCalendarioDto {
  titulo: string;
  descripcion?: string;
  fecha_inicio: string; // Cambiado de fechaInicio
  fecha_fin: string; // Cambiado de fechaFin
  horaInicio: string; // Añadido
  horaFin: string; // Añadido
  fechaHoraNotificacion?: string; // Añadido (opcional, puede ser string ISO 8601)
  actividadId?: number; // Añadido (opcional)
  tipo_evento: 'academico' | 'administrativo' | 'extracurricular'; // Cambiado de tipoEvento
  prioridad: 'alta' | 'media' | 'baja';
  grupo_id?: number; // Cambiado de grupoId, hacerlo opcional si paraTodosLosGrupos es true
  paraTodosLosGrupos?: boolean; // Añadido
  enviar_notificacion: boolean; // Cambiado de enviarNotificacion -> Considerar si este campo es redundante con requiereNotificacion
  requiereNotificacion?: boolean; // Añadido (opcional, basado en el servicio)
  tiempo_recordatorio?: number; // Cambiado de tiempoRecordatorio, hacerlo opcional
}
