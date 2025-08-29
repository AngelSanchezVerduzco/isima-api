/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../database/config';
import { calendario } from '../database/schema/calendario';
import { actividades } from '../database/schema/actividades'; // Importa el esquema de actividades
// Importa los esquemas necesarios para obtener usuarios y grupos
import { usuarios } from '../database/schema/usuarios';
import { grupos_alumnos } from '../database/schema/grupos_alumnos';
import { alumnos } from '../database/schema/alumnos'; // Importa el esquema de alumnos
import { salones } from '../database/schema/salones'; // Importa el esquema de salones
import { eq, and, gte, lte, or, inArray } from 'drizzle-orm';
import { NotificacionesService } from '../notificaciones/notificaciones.service'; // Importa el servicio de notificaciones
import { CreateCalendarioDto } from './dto/create-calendario.dto';
import { UpdateCalendarioDto } from './dto/update-calendario.dto';
import {
  CreateNotificationDto,
  NotificationType,
} from '../notificaciones/dto/create-notification.dto'; // Importa el DTO y el Enum de notificación
import { notificaciones } from '../database/schema/notificaciones'; // Importa el esquema de notificaciones

interface User {
  id: number;
  rol: string; // Asumiendo que el rol está en el objeto User del request
}

type Calendario = typeof calendario.$inferSelect;

@Injectable()
export class CalendarioService {
  constructor(
    private readonly notificacionesService: NotificacionesService // Inyecta el servicio de notificaciones
  ) {}

  // Ajusta el permiso para permitir docentes y administrativos
  private verificarPermisoGestion(user: User) {
    if (user.rol !== 'docente' && user.rol !== 'administrativo') {
      throw new ForbiddenException('No tienes permisos para gestionar eventos en el calendario');
    }
  }

  async create(createCalendarioDto: CreateCalendarioDto, user: User) {
    this.verificarPermisoGestion(user); // Verifica permisos

    try {
      // Validaciones de fechas
      const fechaInicio = new Date(
        `${createCalendarioDto.fecha_inicio}T${createCalendarioDto.horaInicio}` // Usar fecha_inicio
      );
      const fechaFin = new Date(`${createCalendarioDto.fecha_fin}T${createCalendarioDto.horaFin}`); // Usar fecha_fin
      const fechaHoraNotificacion = createCalendarioDto.fechaHoraNotificacion
        ? new Date(createCalendarioDto.fechaHoraNotificacion)
        : null;

      if (fechaInicio > fechaFin) {
        throw new BadRequestException(
          'La fecha y hora de inicio no puede ser posterior a la fecha y hora de fin'
        );
      }

      if (fechaInicio < new Date()) {
        // Permite crear eventos en el pasado si la fecha de notificación es futura?
        // Por ahora, mantenemos la restricción de no crear eventos en el pasado.
        throw new BadRequestException('No se pueden crear eventos en fechas y horas pasadas');
      }

      if (fechaHoraNotificacion && fechaHoraNotificacion > fechaInicio) {
        throw new BadRequestException(
          'La fecha y hora de notificación no puede ser posterior a la fecha y hora de inicio del evento'
        );
      }

      // Lógica para guardar el evento en la tabla 'calendario'
      const [eventoCalendario] = await db
        .insert(calendario)
        .values({
          titulo: createCalendarioDto.titulo,
          descripcion: createCalendarioDto.descripcion,
          actividadId: createCalendarioDto.actividadId, // Usar actividadId del DTO
          fechaInicio: createCalendarioDto.fecha_inicio, // Guardar como string YYYY-MM-DD, usar fecha_inicio
          fechaFin: createCalendarioDto.fecha_fin, // Guardar como string YYYY-MM-DD, usar fecha_fin
          horaInicio: createCalendarioDto.horaInicio, // Guardar como string HH:mm, usar horaInicio del DTO
          horaFin: createCalendarioDto.horaFin, // Guardar como string HH:mm, usar horaFin del DTO
          asignadoPorUsuarioId: user.id, // Obtén esto del usuario autenticado
          grupoId: createCalendarioDto.grupo_id, // Usar grupo_id del DTO
          paraTodosLosGrupos: createCalendarioDto.paraTodosLosGrupos || false, // Usar paraTodosLosGrupos del DTO
          salonId: createCalendarioDto.salon_id, // Usar salon_id del DTO
          requiereNotificacion: createCalendarioDto.requiereNotificacion || false, // Usar requiereNotificacion del DTO
          fechaHoraNotificacion: fechaHoraNotificacion, // Guardar como timestamp
        })
        .returning();

      if (!eventoCalendario) {
        throw new BadRequestException('No se pudo crear el evento de calendario');
      }

      // Si se requiere notificación, crear la entrada(s) en la tabla de notificaciones
      if (eventoCalendario.requiereNotificacion && eventoCalendario.fechaHoraNotificacion) {
        // Lógica para obtener el título y cuerpo de la notificación
        let tituloNotificacion = eventoCalendario.titulo;
        let cuerpoNotificacion = eventoCalendario.descripcion;

        if (eventoCalendario.actividadId) {
          // Si hay una actividad vinculada, podrías usar su título/descripción por defecto
          const actividad = await db
            .select()
            .from(actividades)
            .where(eq(actividades.id, eventoCalendario.actividadId))
            .limit(1);
          if (actividad.length > 0) {
            tituloNotificacion = tituloNotificacion || actividad[0].titulo;
            cuerpoNotificacion = cuerpoNotificacion || actividad[0].descripcion;
          }
        }

        // Lógica para obtener los IDs de los destinatarios (usuarios)
        const destinatarioUsuarioIds: number[] = [];

        if (eventoCalendario.grupoId) {
          // Implementar lógica para obtener IDs de usuarios en este grupo específico
          const usuariosDelGrupo = await db
            .select({ id: usuarios.id })
            .from(grupos_alumnos) // Empezar desde grupos_alumnos
            .innerJoin(alumnos, eq(grupos_alumnos.alumno_id, alumnos.id)) // Unir con alumnos por alumno_id
            .innerJoin(usuarios, eq(alumnos.usuario_id, usuarios.id)) // Unir con usuarios por usuario_id
            .where(eq(grupos_alumnos.grupo_id, eventoCalendario.grupoId));

          destinatarioUsuarioIds.push(...usuariosDelGrupo.map((u) => u.id));
          console.log(
            `Found ${destinatarioUsuarioIds.length} users for group ID ${eventoCalendario.grupoId}`
          );
        } else if (eventoCalendario.paraTodosLosGrupos) {
          // Implementar lógica para obtener IDs de todos los usuarios relevantes (ej: todos los alumnos)
          // Esto depende de cómo identifiques a los "alumnos" en tu tabla de usuarios
          const todosLosAlumnos = await db
            .select({ id: usuarios.id })
            .from(usuarios)
            .where(eq(usuarios.rol, 'alumno')); // Ejemplo: todos los usuarios con rol 'alumno'

          destinatarioUsuarioIds.push(...todosLosAlumnos.map((u) => u.id));
          console.log(
            `Found ${destinatarioUsuarioIds.length} users for all groups (assuming students)`
          );
        }

        // Crear una notificación por cada destinatario usuario
        for (const destinatarioId of destinatarioUsuarioIds) {
          const notificationData: CreateNotificationDto = {
            calendarioId: eventoCalendario.id,
            tipo: NotificationType.InApp, // Define el tipo por defecto o permítelo en el DTO de calendario
            remitenteUsuarioId: user.id,
            destinatarioUsuarioId: destinatarioId,
            titulo: tituloNotificacion || 'Notificación de Evento', // Asegura un título
            cuerpo: cuerpoNotificacion,
            // estado y fechaCreacion tienen default en el esquema
            // fechaEnvio se llena al enviar
          };
          await this.notificacionesService.createNotification(notificationData);
          // Podrías crear notificaciones adicionales para 'gmail' o 'push' aquí si el usuario lo configuró
          // if (usuarioTieneGmailConfigurado) {
          //    await this.notificacionesService.createNotification({ ... tipo: 'gmail' ... });
          // }
        }
        // O si manejas notificaciones a nivel de grupo (menos común para notificaciones personales):
        // if (eventoCalendario.grupoId) {
        //    const notificationData: CreateNotificationDto = {
        //        calendarioId: eventoCalendario.id,
        //        tipo: NotificationType.InApp,
        //        remitenteUsuarioId: user.id,
        //        destinatarioGrupoId: eventoCalendario.grupoId, // Referencia al grupo
        //        titulo: tituloNotificacion || 'Notificación de Evento',
        //        cuerpo: cuerpoNotificacion,
        //    };
        //    await this.notificacionesService.createNotification(notificationData);
        // }
      }

      return {
        mensaje: 'Evento de calendario creado exitosamente',
        datos: eventoCalendario,
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BadRequestException(`Error al crear el evento: ${error.message}`);
      }
      throw new BadRequestException('Error desconocido al crear el evento');
    }
  }

  async findAll(): Promise<Calendario[]> {
    try {
      const eventos = await db.select().from(calendario);
      return eventos;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(`Error al obtener los eventos: ${error.message}`);
      }
      throw new BadRequestException('Error desconocido al obtener los eventos');
    }
  }

  async findOne(id: number): Promise<Calendario> {
    try {
      const result = await db.select().from(calendario).where(eq(calendario.id, id));

      const evento = result[0];

      if (!evento) {
        throw new NotFoundException('Evento no encontrado');
      }

      return evento;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BadRequestException(`Error al obtener el evento: ${error.message}`);
      }
      throw new BadRequestException('Error desconocido al obtener el evento');
    }
  }

  async update(id: number, data: UpdateCalendarioDto, user: User): Promise<Calendario> {
    this.verificarPermisoGestion(user); // Verifica permisos

    try {
      const evento = await this.findOne(id);

      // Verifica si el usuario que intenta actualizar es el creador del evento
      if (evento.asignadoPorUsuarioId !== user.id) {
        throw new ForbiddenException('Solo puedes modificar eventos creados por ti');
      }

      // Prepara los datos para la actualización, manejando las fechas/horas
      const updateData: Partial<typeof calendario.$inferInsert> = {
        ...data,
        fechaInicio: data.fechaInicio, // Ya es string YYYY-MM-DD
        fechaFin: data.fechaFin, // Ya es string YYYY-MM-DD
        horaInicio: data.horaInicio, // Ya es string HH:mm
        horaFin: data.horaFin, // Ya es string HH:mm
        // Convierte fechaHoraNotificacion a Date si es un string ISO 8601
        fechaHoraNotificacion: data.fechaHoraNotificacion
          ? new Date(data.fechaHoraNotificacion)
          : undefined,
      };

      // TODO: Considerar si actualizar un evento debe actualizar/recrear notificaciones asociadas.
      // Por ahora, solo actualizamos el evento. La lógica de notificación se maneja en la creación.

      const result = await db
        .update(calendario)
        .set(updateData)
        .where(eq(calendario.id, id))
        .returning();

      const [updated] = result;

      if (!updated) {
        throw new BadRequestException('No se pudo actualizar el evento');
      }

      return updated;
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BadRequestException(`Error al actualizar el evento: ${error.message}`);
      }
      throw new BadRequestException('Error desconocido al actualizar el evento');
    }
  }

  async remove(id: number, user: User) {
    this.verificarPermisoGestion(user); // Verifica permisos

    try {
      const evento = await this.findOne(id);

      // Verifica si el usuario que intenta eliminar es el creador del evento
      if (evento.asignadoPorUsuarioId !== user.id) {
        throw new ForbiddenException('Solo puedes eliminar eventos creados por ti');
      }

      // TODO: Si no usas cascading deletes en la DB, elimina las notificaciones asociadas aquí
      // await db.delete(notificaciones).where(eq(notificaciones.calendarioId, id));

      await db.delete(calendario).where(eq(calendario.id, id));
      return { message: 'Evento eliminado correctamente' };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BadRequestException(`Error al eliminar el evento: ${error.message}`);
      }
      throw new BadRequestException('Error desconocido al eliminar el evento');
    }
  }

  // Métodos de búsqueda y filtrado actualizados según el nuevo esquema

  async findByDateRange(FechaInicio: string, FechaFin: string): Promise<Calendario[]> {
    try {
      // Asumiendo que FechaInicio y FechaFin son strings 'YYYY-MM-DD'
      const eventos = await db
        .select()
        .from(calendario)
        .where(and(gte(calendario.fechaInicio, FechaInicio), lte(calendario.fechaFin, FechaFin)));
      return eventos;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(
          `Error al obtener los eventos por rango de fecha: ${error.message}`
        );
      }
      throw new BadRequestException('Error desconocido al obtener los eventos por rango de fecha');
    }
  }

  // Eliminado findByTipoEvento y findEventosFiltrados por tipoEvento/prioridad ya que esos campos no están en el nuevo esquema de calendario.
  // El filtrado ahora debería basarse en actividadId, grupoId, rango de fechas, etc.
  // Si necesitas filtrar por tipo de actividad o prioridad, esa lógica debería involucrar un JOIN con la tabla 'actividades'.

  async findEventosPendientes(): Promise<Calendario[]> {
    try {
      const fechaActual = new Date();
      // Consideramos "pendientes" los eventos cuya fecha de fin es igual o posterior a hoy
      const hoyString = fechaActual.toISOString().split('T')[0]; // 'YYYY-MM-DD'

      const eventos = await db
        .select()
        .from(calendario)
        .where(gte(calendario.fechaFin, hoyString))
        .orderBy(calendario.fechaInicio);
      return eventos;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(`Error al obtener los eventos pendientes: ${error.message}`);
      }
      throw new BadRequestException('Error desconocido al obtener los eventos pendientes');
    }
  }

  async findEventosGrupo(grupoId: number): Promise<Calendario[]> {
    try {
      const eventos = await db.select().from(calendario).where(eq(calendario.grupoId, grupoId));
      return eventos;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(`Error al obtener los eventos del grupo: ${error.message}`);
      }
      throw new BadRequestException('Error desconocido al obtener los eventos del grupo');
    }
  }

  // Este método ahora busca eventos que requieren notificación y cuya fecha de notificación es futura
  async findEventosConNotificacionPendiente(): Promise<Calendario[]> {
    try {
      const fechaActual = new Date();
      const eventos = await db
        .select()
        .from(calendario)
        .where(
          and(
            eq(calendario.requiereNotificacion, true),
            gte(calendario.fechaHoraNotificacion, fechaActual) // Compara timestamps (Date objects)
          )
        )
        .orderBy(calendario.fechaHoraNotificacion); // Ordena por fecha de notificación
      return eventos;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(
          `Error al obtener los eventos con notificación pendiente: ${error.message}`
        );
      }
      throw new BadRequestException(
        'Error desconocido al obtener los eventos con notificación pendiente'
      );
    }
  }

  // Este método busca eventos cuya fecha de notificación está en el rango especificado (para el cron job)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findEventosParaNotificar(fechaLimite: Date): Promise<Calendario[]> {
    try {
      const fechaActual = new Date();
      const eventos = await db
        .select()
        .from(calendario)
        .where(
          and(
            eq(calendario.requiereNotificacion, true),
            eq(calendario.fechaHoraNotificacion, fechaActual) // Notificación programada para ahora
            // O si buscas eventos en un rango corto de tiempo futuro:
            // gte(calendario.fechaHoraNotificacion, fechaActual),
            // lte(calendario.fechaHoraNotificacion, fechaLimite)
          )
        );
      return eventos;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(`Error al obtener eventos para notificar: ${error.message}`);
      }
      throw new BadRequestException('Error desconocido al obtener eventos para notificar');
    }
  }

  // Eliminado findEventosConRecordatorio ya que la lógica de notificación se maneja ahora en la tabla 'notificaciones'
  // y el campo tiempoRecordatorio no existe en el nuevo esquema.

  async getEventosBuzonParaUsuario(usuarioId: number) {
    console.log(`Buscando eventos para usuario ID: ${usuarioId}`);
    
    // 1. Buscar el alumno_id correspondiente al usuarioId autenticado
    const alumno = await db
      .select({ id: alumnos.id })
      .from(alumnos)
      .where(eq(alumnos.usuario_id, usuarioId));
    
    console.log(`Alumno encontrado:`, alumno);
    
    if (!alumno.length) {
      console.log('No se encontró alumno para este usuario, retornando array vacío');
      return [];
    }
    
    const alumnoId = alumno[0].id;
    console.log(`Alumno ID: ${alumnoId}`);

    // 2. Obtener los grupos a los que pertenece el alumno
    const gruposAlumno = await db
      .select({ grupo_id: grupos_alumnos.grupo_id })
      .from(grupos_alumnos)
      .where(eq(grupos_alumnos.alumno_id, alumnoId));
    
    const grupoIds = gruposAlumno.map(g => g.grupo_id).filter(id => id !== null);
    console.log(`Grupos del alumno:`, grupoIds);

    // 3. Obtener eventos de calendario para esos grupos, para todos los grupos, o para el usuario
    let whereConditions = [
      eq(calendario.paraTodosLosGrupos, true),
      eq(calendario.asignadoPorUsuarioId, usuarioId)
    ];
    
    // Solo agregar la condición de grupos si el alumno tiene grupos
    if (grupoIds.length > 0) {
      whereConditions.push(inArray(calendario.grupoId, grupoIds));
    }
    
    const eventosCalendario = await db
      .select()
      .from(calendario)
      .where(or(...whereConditions));
    
    console.log(`Eventos encontrados:`, eventosCalendario.length);
    console.log(`Eventos para todos los grupos:`, eventosCalendario.filter(e => e.paraTodosLosGrupos));
    console.log(`Eventos para grupos específicos:`, eventosCalendario.filter(e => e.grupoId && grupoIds.includes(e.grupoId)));

    // 4. Obtener notificaciones para el usuario
    const notificacionesUsuario = await db
      .select()
      .from(notificaciones)
      .where(eq(notificaciones.destinatarioUsuarioId, usuarioId));
    const notificacionPorCalendario = Object.fromEntries(
      notificacionesUsuario.map(n => [n.calendarioId, n])
    );

    // 5. Obtener actividades relacionadas
    const actividadIds = [...new Set(eventosCalendario.map(e => e.actividadId).filter(id => id !== null))];
    let actividadesMap = {};
    if (actividadIds.length > 0) {
      const acts = await db
        .select()
        .from(actividades)
        .where(inArray(actividades.id, actividadIds));
      actividadesMap = Object.fromEntries(acts.map(a => [a.id, a]));
    }

    // 6. Obtener salones relacionados
    const salonIds = [...new Set(eventosCalendario.map(e => e.salonId).filter(id => id !== null))];
    let salonesMap = {};
    if (salonIds.length > 0) {
      const salons = await db
        .select()
        .from(salones)
        .where(inArray(salones.id, salonIds));
      salonesMap = Object.fromEntries(salons.map(s => [s.id, s]));
    }

    // 7. Unir la información y marcar prioritarios
    const eventos = eventosCalendario.map(ev => {
      const noti = notificacionPorCalendario[ev.id];
      const actividad = ev.actividadId ? actividadesMap[ev.actividadId] : null;
      const salon = ev.salonId ? salonesMap[ev.salonId] : null;
      return {
        id: ev.id,
        titulo: ev.titulo,
        descripcion: ev.descripcion,
        fecha_inicio: ev.fechaInicio,
        fecha_fin: ev.fechaFin,
        hora_inicio: ev.horaInicio,
        hora_fin: ev.horaFin,
        asignado_por_usuario_id: ev.asignadoPorUsuarioId,
        grupo_id: ev.grupoId,
        salon: salon,
        actividad: actividad,
        prioridad: !!noti,
        notificacion: noti || null
      };
    });

    // 8. Ordenar: prioritarios primero
    eventos.sort((a, b) => (b.prioridad ? 1 : 0) - (a.prioridad ? 1 : 0));
    
    console.log(`Eventos finales retornados:`, eventos.length);
    console.log(`IDs de eventos retornados:`, eventos.map(e => e.id));
    
    return eventos;
  }
}
