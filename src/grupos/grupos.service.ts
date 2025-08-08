import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { count } from 'drizzle-orm';
import { db } from '../database/config';
import { grupos } from '../database/schema/grupos';
import { docenteGrupos } from '../database/schema/docente-grupos';
import { codigos_invitacion } from '../database/schema/codigos_invitacion';
import { grupos_alumnos } from '../database/schema/grupos_alumnos';
import { alumnos } from '../database/schema/alumnos';
import { eq, like, and, inArray } from 'drizzle-orm';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { UpdateGrupoDto } from './dto/update-grupo.dto';
@Injectable()
export class GruposService {
  async create(data: CreateGrupoDto) {
    try {
      const [grupo] = await db.insert(grupos).values(data).returning();
      return grupo;
    } catch (error) {
      if ((error as { code: string }).code === 'SQLITE_CONSTRAINT') {
        throw new ConflictException(
          'Ya existe un grupo con ese nombre en el año escolar especificado'
        );
      }
      throw error;
    }
  }
  async findAll() {
    return await db.select().from(grupos);
  }
  async update(id: number, data: UpdateGrupoDto) {
    try {
      const [grupo] = await db.update(grupos).set(data).where(eq(grupos.id, id)).returning();
      if (!grupo) {
        throw new NotFoundException('Grupo no encontrado');
      }
      return grupo;
    } catch (error) {
      if ((error as { code: string }).code === 'SQLITE_CONSTRAINT') {
        throw new ConflictException(
          'Ya existe un grupo con ese nombre en el año escolar especificado'
        );
      }
      throw error;
    }
  }
  async remove(id: number) {
    const [grupo] = await db.delete(grupos).where(eq(grupos.id, id)).returning();
    if (!grupo) {
      throw new NotFoundException('Grupo no encontrado');
    }
    return grupo;
  }
  async findByEstado(estado: 'activo' | 'inactivo') {
    return await db.select().from(grupos).where(eq(grupos.estado, estado));
  }
  async findBySemestre(semestre: number) {
    return await db.select().from(grupos).where(eq(grupos.semestre, semestre));
  }
  async findByTurno(turno: 'matutino' | 'vespertino') {
    return await db.select().from(grupos).where(eq(grupos.turno, turno));
  }

  async findByAnioEscolar(anio_escolar: string) {
    return await db.select().from(grupos).where(eq(grupos.anio_escolar, anio_escolar));
  }

  async findByNombre(nombre: string) {
    return await db
      .select()
      .from(grupos)
      .where(like(grupos.nombre, `%${nombre}%`));
  }
  async findOne(id: number) {
    const [grupo] = await db.select().from(grupos).where(eq(grupos.id, id));
    if (!grupo) {
      throw new NotFoundException('Grupo no encontrado');
    }
    return grupo;
  }

  async getTotalGrupos() {
    const [result] = await db.select({ count: count() }).from(grupos);
    return result.count;
  }

  // Métodos para filtrar grupos por docente
  async findByDocente(docenteId: number) {
    // Primero obtenemos los IDs de los grupos asociados al docente
    const docenteGruposRelacion = await db
      .select({ grupoId: docenteGrupos.grupoId })
      .from(docenteGrupos)
      .where(eq(docenteGrupos.docenteId, docenteId));

    if (docenteGruposRelacion.length === 0) {
      return [];
    }

    // Extraemos los IDs de los grupos
    const gruposIds = docenteGruposRelacion.map((dg) => dg.grupoId);

    // Obtenemos los detalles completos de los grupos
    return await db.select().from(grupos).where(inArray(grupos.id, gruposIds));
  }

  async findByDocenteAndEstado(docenteId: number, estado: 'activo' | 'inactivo') {
    // Obtenemos los IDs de los grupos asociados al docente
    const docenteGruposRelacion = await db
      .select({ grupoId: docenteGrupos.grupoId })
      .from(docenteGrupos)
      .where(eq(docenteGrupos.docenteId, docenteId));

    if (docenteGruposRelacion.length === 0) {
      return [];
    }

    // Extraemos los IDs de los grupos
    const gruposIds = docenteGruposRelacion.map((dg) => dg.grupoId);

    // Obtenemos los grupos con el estado especificado
    return await db
      .select()
      .from(grupos)
      .where(and(inArray(grupos.id, gruposIds), eq(grupos.estado, estado)));
  }

  async findByDocenteAndAnioEscolar(docenteId: number, anio_escolar: string) {
    // Obtenemos los IDs de los grupos asociados al docente
    const docenteGruposRelacion = await db
      .select({ grupoId: docenteGrupos.grupoId })
      .from(docenteGrupos)
      .where(eq(docenteGrupos.docenteId, docenteId));

    if (docenteGruposRelacion.length === 0) {
      return [];
    }

    // Extraemos los IDs de los grupos
    const gruposIds = docenteGruposRelacion.map((dg) => dg.grupoId);

    // Obtenemos los grupos del año escolar especificado
    return await db
      .select()
      .from(grupos)
      .where(and(inArray(grupos.id, gruposIds), eq(grupos.anio_escolar, anio_escolar)));
  }

  async findByDocenteAndNombre(docenteId: number, nombre: string) {
    // Obtenemos los IDs de los grupos asociados al docente
    const docenteGruposRelacion = await db
      .select({ grupoId: docenteGrupos.grupoId })
      .from(docenteGrupos)
      .where(eq(docenteGrupos.docenteId, docenteId));

    if (docenteGruposRelacion.length === 0) {
      return [];
    }

    // Extraemos los IDs de los grupos
    const gruposIds = docenteGruposRelacion.map((dg) => dg.grupoId);

    // Obtenemos los grupos cuyo nombre coincida con la búsqueda
    return await db
      .select()
      .from(grupos)
      .where(and(inArray(grupos.id, gruposIds), like(grupos.nombre, `%${nombre}%`)));
  }

  /**
   * Genera un código de invitación para un grupo
   */
  async generarCodigoInvitacion(
    grupoId: number,
    usuarioId: number,
    diasValidez: number,
    maxUsos?: number
  ) {
    // Verificar que el grupo existe
    const grupo = await this.findOne(grupoId);

    // Verificar que el grupo esté activo
    if (grupo.estado === 'inactivo') {
      throw new BadRequestException(
        'No se pueden generar códigos de invitación para grupos inactivos'
      );
    }

    // Verificar si ya existe un código activo para este grupo
    const fechaActual = new Date();
    const [codigoExistente] = await db
      .select()
      .from(codigos_invitacion)
      .where(and(eq(codigos_invitacion.grupo_id, grupoId), eq(codigos_invitacion.activo, true)));

    // Si ya existe un código activo y no ha expirado, retornarlo
    if (codigoExistente) {
      const fechaExpiracionExistente = new Date(codigoExistente.fecha_expiracion);

      if (fechaActual < fechaExpiracionExistente) {
        return {
          codigo: codigoExistente.codigo,
          grupo: grupo.nombre,
          fecha_expiracion: codigoExistente.fecha_expiracion,
          max_usos: codigoExistente.max_usos,
          mensaje: 'Ya existe un código activo para este grupo',
        };
      }

      // Si el código existente ha expirado, lo marcamos como inactivo
      await db
        .update(codigos_invitacion)
        .set({ activo: false })
        .where(eq(codigos_invitacion.id, codigoExistente.id));
    }

    // Generar código único alfanumérico (letras y números)
    const codigo = this.generarCodigoAleatorio(8);

    // Calcular fecha de expiración
    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + diasValidez);

    // Guardar en la base de datos
    const [codigoInvitacion] = await db
      .insert(codigos_invitacion)
      .values({
        codigo,
        grupo_id: grupoId,
        creado_por: usuarioId,
        fecha_expiracion: fechaExpiracion.toISOString(),
        max_usos: maxUsos || null,
      })
      .returning();

    return {
      codigo: codigoInvitacion.codigo,
      grupo: grupo.nombre,
      fecha_expiracion: codigoInvitacion.fecha_expiracion,
      max_usos: codigoInvitacion.max_usos,
    };
  }

  /**
   * Genera un código alfanumérico aleatorio
   */
  private generarCodigoAleatorio(longitud: number): string {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let resultado = '';

    for (let i = 0; i < longitud; i++) {
      resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }

    return resultado;
  }

  /**
   * Permite a un alumno unirse a un grupo mediante un código de invitación
   */
  async unirseAGrupo(codigo: string, usuarioId: number) {
    try {
      console.log(
        `Iniciando proceso de unirse a grupo con código: ${codigo} para usuarioId: ${usuarioId}`
      );

      // Verificar que el alumno existe (buscando por usuario_id, no por id)
      const [alumnoExiste] = await db
        .select()
        .from(alumnos)
        .where(eq(alumnos.usuario_id, usuarioId));

      if (!alumnoExiste) {
        console.log(`Error: No se encontró un alumno asociado al usuario con ID ${usuarioId}`);
        throw new NotFoundException(
          `No se encontró un alumno asociado al usuario con ID ${usuarioId}`
        );
      }

      // Usamos el ID del alumno, no el ID del usuario
      const alumnoId = alumnoExiste.id;

      console.log(`Alumno verificado: ${JSON.stringify(alumnoExiste)}`);

      // Buscar el código de invitación
      const [codigoInvitacion] = await db
        .select()
        .from(codigos_invitacion)
        .where(and(eq(codigos_invitacion.codigo, codigo), eq(codigos_invitacion.activo, true)));

      if (!codigoInvitacion) {
        throw new NotFoundException('Código de invitación no válido');
      }

      console.log(`Código de invitación encontrado: ${JSON.stringify(codigoInvitacion)}`);

      // Verificar que el grupo existe
      const [grupoExiste] = await db
        .select()
        .from(grupos)
        .where(eq(grupos.id, codigoInvitacion.grupo_id));

      if (!grupoExiste) {
        console.log(`Error: Grupo con ID ${codigoInvitacion.grupo_id} no encontrado`);
        throw new NotFoundException(`Grupo con ID ${codigoInvitacion.grupo_id} no encontrado`);
      }

      console.log(`Grupo verificado: ${JSON.stringify(grupoExiste)}`);

      // Verificar si el código está expirado
      const fechaActual = new Date();
      const fechaExpiracion = new Date(codigoInvitacion.fecha_expiracion);

      if (fechaActual > fechaExpiracion) {
        throw new BadRequestException('Código de invitación expirado');
      }

      // Verificar si se alcanzó el máximo de usos
      if (
        codigoInvitacion.max_usos !== null &&
        (codigoInvitacion.usos || 0) >= codigoInvitacion.max_usos
      ) {
        throw new BadRequestException('Este código ha alcanzado su límite de usos');
      }

      // Verificar si el alumno ya está en el grupo
      const [existeRelacion] = await db
        .select()
        .from(grupos_alumnos)
        .where(
          and(
            eq(grupos_alumnos.alumno_id, alumnoId),
            eq(grupos_alumnos.grupo_id, codigoInvitacion.grupo_id)
          )
        );

      if (existeRelacion) {
        throw new ConflictException('Ya estás registrado en este grupo');
      }

      console.log(
        `Intentando insertar en grupos_alumnos: alumno_id=${alumnoId}, grupo_id=${codigoInvitacion.grupo_id}`
      );

      // Registrar al alumno en el grupo
      await db.insert(grupos_alumnos).values({
        alumno_id: alumnoId,
        grupo_id: codigoInvitacion.grupo_id,
      });

      console.log('Inserción en grupos_alumnos exitosa');

      // Incrementar el contador de usos del código
      await db
        .update(codigos_invitacion)
        .set({ usos: (codigoInvitacion.usos || 0) + 1 })
        .where(eq(codigos_invitacion.id, codigoInvitacion.id));

      // Obtener los detalles del grupo
      const grupo = await this.findOne(codigoInvitacion.grupo_id);

      return {
        mensaje: 'Te has unido al grupo exitosamente',
        grupo,
      };
    } catch (error) {
      console.error('Error en unirseAGrupo:', error);
      throw error;
    }
  }
}
