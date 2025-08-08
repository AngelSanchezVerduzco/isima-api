import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateAlumnoDto } from './dto/create-alumno.dto';
import { UpdateAlumnoDto } from './dto/update-alumno.dto';
import { db } from '../database/config';
import { alumnos, grupos_alumnos, grupos, usuarios, codigos_invitacion } from '../database/schema';
import { eq, and, gt } from 'drizzle-orm';
import { AsignarGrupoDto } from './dto/asignar-grupo.dto';
import { inArray } from 'drizzle-orm';
import { docenteGrupos } from '../database/schema/docente-grupos';
import { docentes } from '../database/schema/docentes';

@Injectable()
export class AlumnosService {
  async create(createAlumnoDto: CreateAlumnoDto) {
    try {
      const [alumno] = await db
        .insert(alumnos)
        .values({
          ...createAlumnoDto,
          usuario_id: Number(createAlumnoDto.usuario_id),
        })
        .returning();
      return alumno;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'SQLITE_CONSTRAINT') {
        throw new ConflictException('La matrícula ya existe');
      }
      throw error;
    }
  }
  async findAll() {
    return await db.select().from(alumnos);
  }
  async findOne(id: number) {
    const [alumno] = await db.select().from(alumnos).where(eq(alumnos.id, id));
    if (!alumno) {
      throw new NotFoundException(`Alumno #${id} no encontrado`);
    }
    return alumno;
  }
  async update(id: number, updateAlumnoDto: UpdateAlumnoDto) {
    const [alumno] = await db
      .update(alumnos)
      .set({
        ...updateAlumnoDto,
        usuario_id: updateAlumnoDto.usuario_id ? Number(updateAlumnoDto.usuario_id) : undefined,
      })
      .where(eq(alumnos.id, id))
      .returning();
    if (!alumno) {
      throw new NotFoundException('Alumno no encontrado');
    }
    return alumno;
  }
  async remove(id: number) {
    const [alumno] = await db.delete(alumnos).where(eq(alumnos.id, id)).returning();
    if (!alumno) {
      throw new NotFoundException('Alumno no encontrado');
    }
    return alumno;
  }
  async asignarGrupo(asignarGrupoDto: AsignarGrupoDto) {
    const alumno = await this.findOne(asignarGrupoDto.alumno_id);
    if (!alumno) {
      throw new NotFoundException('Alumno no encontrado');
    }
    const [grupo] = await db.select().from(grupos).where(eq(grupos.id, asignarGrupoDto.grupo_id));
    if (!grupo) {
      throw new NotFoundException('Grupo no encontrado');
    }
    const [asignacionExistente] = await db
      .select()
      .from(grupos_alumnos)
      .where(
        and(
          eq(grupos_alumnos.alumno_id, asignarGrupoDto.alumno_id),
          eq(grupos_alumnos.grupo_id, asignarGrupoDto.grupo_id)
        )
      );
    if (asignacionExistente) {
      throw new ConflictException('El alumno ya está asignado a este grupo');
    }
    const [asignacion] = await db.insert(grupos_alumnos).values(asignarGrupoDto).returning();
    return asignacion;
  }

  async desasignarGrupo(alumno_id: number, grupo_id: number) {
    const [eliminado] = await db
      .delete(grupos_alumnos)
      .where(and(eq(grupos_alumnos.alumno_id, alumno_id), eq(grupos_alumnos.grupo_id, grupo_id)))
      .returning();
    if (!eliminado) {
      throw new NotFoundException('Asignación no encontrada');
    }
    return eliminado;
  }
  async ObtenerGruposAlumno(alumnoId: number) {
    await this.findOne(alumnoId);
    return await db
      .select({ grupo: grupos, asignacion: grupos_alumnos })
      .from(grupos_alumnos)
      .innerJoin(grupos, eq(grupos.id, grupos_alumnos.grupo_id))
      .where(eq(grupos_alumnos.alumno_id, alumnoId));
  }

  async obtenerAlumnosPorGrupo(grupoId: number) {
    // Verificar que el grupo existe
    const [grupo] = await db.select().from(grupos).where(eq(grupos.id, grupoId));
    if (!grupo) {
      throw new NotFoundException(`Grupo #${grupoId} no encontrado`);
    }

    // Obtener todos los alumnos del grupo con su información de usuario
    const alumnosDelGrupo = await db
      .select({
        alumno: alumnos,
        usuario: usuarios,
      })
      .from(grupos_alumnos)
      .innerJoin(alumnos, eq(alumnos.id, grupos_alumnos.alumno_id))
      .innerJoin(usuarios, eq(usuarios.id, alumnos.usuario_id))
      .where(eq(grupos_alumnos.grupo_id, grupoId));

    // Combinar los datos de alumno y usuario en un solo objeto
    return alumnosDelGrupo.map((item) => ({
      id: item.alumno.id,
      matricula: item.alumno.matricula,
      estado: item.alumno.estado,
      nombre: item.usuario.nombre,
      apellido_paterno: item.usuario.apellidoP,
      apellido_materno: item.usuario.apellidoM,
      email: item.usuario.correo,
    }));
  }

  async findByUsuarioId(usuarioId: number) {
    const [alumno] = await db.select().from(alumnos).where(eq(alumnos.usuario_id, usuarioId));
    return alumno;
  }

  async joinClass(usuarioId: number, codigo: string) {
    // 1. Buscar el código de invitación
    const [invitacion] = await db
      .select()
      .from(codigos_invitacion)
      .where(and(
        eq(codigos_invitacion.codigo, codigo),
        eq(codigos_invitacion.activo, true),
        gt(codigos_invitacion.fecha_expiracion, new Date().toISOString())
      ));

    if (!invitacion) {
      throw new NotFoundException('Código de invitación inválido, inactivo o expirado.');
    }

    const grupoId = invitacion.grupo_id;

    // 2. Verificar si el alumno ya está en este grupo
    const [alumno] = await db.select().from(alumnos).where(eq(alumnos.usuario_id, usuarioId));

    if (!alumno) {
        throw new NotFoundException('Usuario no asociado a un alumno.');
    }

    const [asignacionExistente] = await db
      .select()
      .from(grupos_alumnos)
      .where(
        and(
          eq(grupos_alumnos.alumno_id, alumno.id),
          eq(grupos_alumnos.grupo_id, grupoId)
        )
      );

    if (asignacionExistente) {
      throw new ConflictException('Ya estás unido a esta clase.');
    }

    // 3. Agregar al alumno al grupo
    await db.insert(grupos_alumnos).values({
      alumno_id: alumno.id,
      grupo_id: grupoId,
    });

    // 4. Obtener información del grupo para devolver
    const [grupo] = await db.select().from(grupos).where(eq(grupos.id, grupoId));

    if (!grupo) {
        throw new NotFoundException('Grupo asociado al código no encontrado.');
    }

    return grupo;
  }

  // NUEVO MÉTODO: Obtener grupos, materias y docentes de un alumno
  async obtenerMateriasYDocentesPorAlumno(alumnoId: number) {
    // 1. Obtener los grupos a los que pertenece el alumno
    const gruposAlumno = await db
      .select({ grupo_id: grupos_alumnos.grupo_id })
      .from(grupos_alumnos)
      .where(eq(grupos_alumnos.alumno_id, alumnoId));
    if (!gruposAlumno.length) return [];
    const grupoIds = gruposAlumno.map(g => g.grupo_id).filter(id => id !== null);

    // 2. Obtener la información de los grupos
    const gruposInfo = await db
      .select({ id: grupos.id, nombre_grupo: grupos.nombre })
      .from(grupos)
      .where(inArray(grupos.id, grupoIds));

    // 3. Obtener materias y docentes de esos grupos
    const materiasDocentes = await db
      .select({
        grupo_id: docenteGrupos.grupoId,
        materia: docenteGrupos.materia,
        docente_id: docenteGrupos.docenteId,
        estado: docenteGrupos.estado
      })
      .from(docenteGrupos)
      .where(inArray(docenteGrupos.grupoId, grupoIds));

    // 4. Obtener los usuario_id de los docentes
    const docenteIds = [...new Set(materiasDocentes.map(md => md.docente_id))];
    const docentesInfo = await db
      .select({ id: docentes.id, usuario_id: docentes.usuario_id })
      .from(docentes)
      .where(inArray(docentes.id, docenteIds));
    const usuarioIds = docentesInfo.map(d => d.usuario_id).filter(id => id !== null);

    // 5. Obtener nombres de usuarios (docentes)
    const usuariosDocentes = await db
      .select({ id: usuarios.id, nombre: usuarios.nombre, apellidoP: usuarios.apellidoP, apellidoM: usuarios.apellidoM })
      .from(usuarios)
      .where(inArray(usuarios.id, usuarioIds));

    // 6. Mapear docente_id a usuario_id y luego a nombre completo
    const docenteIdToUsuarioId = Object.fromEntries(docentesInfo.map(d => [d.id, d.usuario_id]));
    const usuarioIdToNombre = Object.fromEntries(usuariosDocentes.map(u => [u.id, `${u.nombre} ${u.apellidoP} ${u.apellidoM}`]));

    // 7. Unir la información
    const gruposMap = Object.fromEntries(gruposInfo.map(g => [g.id, g.nombre_grupo]));

    // 8. Formatear resultado
    return materiasDocentes.map(md => {
      const usuarioId = docenteIdToUsuarioId[md.docente_id];
      return {
        grupo_id: md.grupo_id,
        nombre_grupo: gruposMap[md.grupo_id] || '',
        materia: md.materia,
        docente: usuarioId && usuarioIdToNombre[usuarioId] ? usuarioIdToNombre[usuarioId] : '',
        estado: md.estado
      };
    });
  }
}
