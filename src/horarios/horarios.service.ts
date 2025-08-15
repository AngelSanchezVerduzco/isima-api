/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { db } from '../database/config';
import { horarios, horarioSlots } from '../database/schema';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { CreateHorarioSlotDto } from './dto/create-horario-slot.dto';
import { eq, and, between, sql, inArray } from 'drizzle-orm';
import { usuarios as usuariosAlumnos, usuarios as usuariosDocentes } from '../database/schema';
import { alias } from 'drizzle-orm/sqlite-core'; // O el paquete correspondiente a tu base de datos

import {
  usuarios,
  grupos,
  alumnos,
  docentes,
  salones,
  grupos_alumnos,
  docenteGrupos,
} from '../database/schema';

interface HorarioSlotDetallado {
  id: number;
  dia: string;
  horaInicio: string;
  horaFin: string;
  grupo?: {
    id: number;
    nombre: string;
  };
  salon?: {
    id: number;
    nombre: string;
  };
  docente?: {
    id: number;
    nombre: string;
  };
  materia?: string;
}

@Injectable()
export class HorariosService {
  async create(createHorarioDto: CreateHorarioDto) {
    try {
      const [horario] = await db.insert(horarios).values(createHorarioDto).returning();
      return {
        mensaje: 'Horario base creado exitosamente',
        datos: horario,
      };
    } catch (error) {
      throw new BadRequestException('Error al crear el horario');
    }
  }

  async createSlot(createHorarioSlotDto: CreateHorarioSlotDto) {
    try {
      const normalizedSlot = {
        ...createHorarioSlotDto,
        dia: createHorarioSlotDto.dia.toUpperCase(),
      };

      const conflictos = await this.verificarConflictos(normalizedSlot as CreateHorarioSlotDto);
      if (conflictos.length > 0) {
        throw new BadRequestException('Existe un conflicto de horario para este salon');
      }
      const [slot] = await db.insert(horarioSlots).values(normalizedSlot).returning();
      return {
        mensaje: 'Slot de horario creado exitosamente',
        datos: slot,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al crear el slot de horario');
    }
  }
  private async verificarConflictos(slot: CreateHorarioSlotDto) {
    try {
      const conflictos = await db
        .select()
        .from(horarioSlots)
        .where(
          and(
            eq(horarioSlots.salonId, slot.salonId),
            eq(horarioSlots.dia, slot.dia),
            and(
              between(horarioSlots.horaInicio, slot.horaInicio, slot.horaFin),
              between(horarioSlots.horaFin, slot.horaInicio, slot.horaFin)
            )
          )
        );
      return conflictos;
    } catch (error) {
      throw new BadRequestException('Error al verificar conflictos de horario');
    }
  }

  async findOne(id: number) {
    try {
      const horario = await db.select().from(horarios).where(eq(horarios.id, id)).limit(1);

      if (!horario || horario.length === 0) {
        throw new NotFoundException(`Horario con ID ${id} no encontrado`);
      }

      return horario[0];
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Error al buscar el horario');
    }
  }
  async findAll() {
    return await db.select().from(horarios);
  }
  async findSlotsByHorario(horarioId: number) {
    return await db.select().from(horarioSlots).where(eq(horarioSlots.horarioId, horarioId));
  }

  async update(id: number, updateHorarioDto: Partial<CreateHorarioDto>) {
    const [horario] = await db
      .update(horarios)
      .set(updateHorarioDto)
      .where(eq(horarios.id, id))
      .returning();

    if (!horario) {
      throw new NotFoundException('Horario no encontrado');
    }
    return {
      mensaje: 'Horario actualizado exitosamente',
      datos: horario,
    };
  }

  async remove(id: number) {
    await db.delete(horarioSlots).where(eq(horarioSlots.horarioId, id));
    const [horario] = await db.delete(horarios).where(eq(horarios.id, id)).returning();
    if (!horario) {
      throw new NotFoundException('Horario no encontrado');
    }
    return {
      mensaje: 'Horario y sus slots eliminados exitosamente',
      datos: horario,
    };
  }

  async removeSlot(id: number) {
    const [slot] = await db.delete(horarioSlots).where(eq(horarioSlots.id, id)).returning();
    if (!slot) {
      throw new NotFoundException('Slot de horario no encontrado');
    }
    return {
      mensaje: 'Slot de horario eliminado exitosamente',
      datos: slot,
    };
  }

  async findScheduleForUser(userId: number): Promise<HorarioSlotDetallado[]> {
    try {
      // Buscar el alumno correspondiente al usuario
      const alumno = await db
        .select({ id: alumnos.id })
        .from(alumnos)
        .where(eq(alumnos.usuario_id, userId))
        .limit(1);

      if (alumno.length === 0) {
        return [];
      }

      const alumnoId = alumno[0].id;

      // Buscar los grupos del alumno
      const gruposAlumno = await db
        .select({ grupoId: grupos_alumnos.grupo_id })
        .from(grupos_alumnos)
        .where(eq(grupos_alumnos.alumno_id, alumnoId));

      if (gruposAlumno.length === 0) {
        return [];
      }

      const grupoIds = gruposAlumno.map((g) => g.grupoId);

      // Buscar los horarios de esos grupos
      const horariosGrupo = await db
        .select()
        .from(horarios)
        .where(
          and(
            sql`${horarios.grupoId} IN (${grupoIds.join(',')})`,
            eq(horarios.activo, true)
          )
        );

      if (horariosGrupo.length === 0) {
        return [];
      }

      const horarioIds = horariosGrupo.map((h) => h.id);

      // Buscar los slots de esos horarios
      const slots = await db
        .select()
        .from(horarioSlots)
        .where(sql`${horarioSlots.horarioId} IN (${horarioIds.join(',')})`);

      // Obtener información detallada de cada slot
      const slotsDetallados: HorarioSlotDetallado[] = [];

      for (const slot of slots) {
        const slotDetallado: HorarioSlotDetallado = {
          id: slot.id,
          dia: slot.dia,
          horaInicio: slot.horaInicio,
          horaFin: slot.horaFin,
          materia: slot.materia,
        };

        // Obtener información del salón
        if (slot.salonId) {
          const salon = await db
            .select({ id: salones.id, nombre: salones.nombre })
            .from(salones)
            .where(eq(salones.id, slot.salonId))
            .limit(1);
          if (salon.length > 0) {
            slotDetallado.salon = salon[0];
          }
        }

        // Obtener información del docente
        if (slot.docenteGrupoId) {
          const docenteGrupo = await db
            .select({ 
              docenteId: docenteGrupos.docenteId,
              materia: docenteGrupos.materia 
            })
            .from(docenteGrupos)
            .where(eq(docenteGrupos.id, slot.docenteGrupoId))
            .limit(1);

          if (docenteGrupo.length > 0) {
            const docente = await db
              .select({ id: docentes.id, usuarioId: docentes.usuario_id })
              .from(docentes)
              .where(eq(docentes.id, docenteGrupo[0].docenteId))
              .limit(1);

            if (docente.length > 0 && docente[0].usuarioId) {
              const usuarioDocente = await db
                .select({ nombre: usuarios.nombre })
                .from(usuarios)
                .where(eq(usuarios.id, docente[0].usuarioId))
                .limit(1);

              if (usuarioDocente.length > 0) {
                slotDetallado.docente = {
                  id: docente[0].id,
                  nombre: usuarioDocente[0].nombre,
                };
              }
            }
          }
        }

        slotsDetallados.push(slotDetallado);
      }

      return slotsDetallados;
    } catch (error) {
      throw new BadRequestException('Error al obtener el horario del usuario');
    }
  }

  async getHorarioGrupoAlumno(userId: number) {
    try {
      // Buscar el alumno correspondiente al usuario
      const alumno = await db
        .select({ id: alumnos.id })
        .from(alumnos)
        .where(eq(alumnos.usuario_id, userId))
        .limit(1);

      if (alumno.length === 0) {
        return { mensaje: 'Usuario no es un alumno', horario: [] };
      }

      const alumnoId = alumno[0].id;

      // Buscar los grupos del alumno
      const gruposAlumno = await db
        .select({ 
          grupoId: grupos_alumnos.grupo_id,
          grupoNombre: grupos.nombre 
        })
        .from(grupos_alumnos)
        .innerJoin(grupos, eq(grupos_alumnos.grupo_id, grupos.id))
        .where(eq(grupos_alumnos.alumno_id, alumnoId));

      if (gruposAlumno.length === 0) {
        return { mensaje: 'Alumno no está asignado a ningún grupo', horario: [] };
      }

      const grupoIds = gruposAlumno.map((g) => g.grupoId).filter(id => id !== null);
      const grupoNombre = gruposAlumno[0].grupoNombre;

      // Buscar los horarios activos de esos grupos
      const horariosGrupo = await db
        .select()
        .from(horarios)
        .where(
          and(
            inArray(horarios.grupoId, grupoIds),
            eq(horarios.activo, true)
          )
        );

      if (horariosGrupo.length === 0) {
        return { 
          mensaje: `No hay horarios activos para el grupo ${grupoNombre}`, 
          horario: [],
          grupo: grupoNombre
        };
      }

      const horarioIds = horariosGrupo.map((h) => h.id).filter(id => id !== null);

      // Buscar los slots de esos horarios con información completa
      const slots = await db
        .select({
          id: horarioSlots.id,
          dia: horarioSlots.dia,
          horaInicio: horarioSlots.horaInicio,
          horaFin: horarioSlots.horaFin,
          salonId: horarioSlots.salonId,
          docenteGrupoId: horarioSlots.docenteGrupoId,
          materia: horarioSlots.materia,
          salonNombre: salones.nombre,
          docenteNombre: usuarios.nombre
        })
        .from(horarioSlots)
        .leftJoin(salones, eq(horarioSlots.salonId, salones.id))
        .leftJoin(docenteGrupos, eq(horarioSlots.docenteGrupoId, docenteGrupos.id))
        .leftJoin(docentes, eq(docenteGrupos.docenteId, docentes.id))
        .leftJoin(usuarios, eq(docentes.usuario_id, usuarios.id))
        .where(inArray(horarioSlots.horarioId, horarioIds))
        .orderBy(horarioSlots.dia, horarioSlots.horaInicio);

      // Organizar por días de la semana
      const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
      const horarioOrganizado = {};

      // Función para normalizar el formato de días
      const normalizarDia = (dia) => {
        const mapeo = {
          'LUNES': 'Lunes',
          'MARTES': 'Martes', 
          'MIÉRCOLES': 'Miércoles',
          'JUEVES': 'Jueves',
          'VIERNES': 'Viernes'
        };
        return mapeo[dia] || dia;
      };

      diasSemana.forEach(dia => {
        horarioOrganizado[dia] = slots.filter(slot => normalizarDia(slot.dia) === dia);
      });

      return {
        mensaje: 'Horario obtenido exitosamente',
        grupo: grupoNombre,
        horario: horarioOrganizado,
        slots: slots
      };
    } catch (error) {
      throw new BadRequestException('Error al obtener el horario del grupo del alumno');
    }
  }
}
