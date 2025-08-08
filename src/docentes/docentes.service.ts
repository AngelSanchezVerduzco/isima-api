import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateDocenteDto } from './dto/create-docente.dto';
import { UpdateDocenteDto } from './dto/update-docente.dto';
import { CreateDocenteGrupoDto } from './dto/create-docente-grupo.dto';
import { UpdateDocenteGrupoDto } from './dto/update-docente-grupo.dto';
import { db } from '../database/config';
import { docentes, usuarios, docenteGrupos, grupos } from '../database/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class DocentesService {
  async create(createDocenteDto: CreateDocenteDto) {
    try {
      const [usuario] = await db
        .select()
        .from(usuarios)
        .where(eq(usuarios.id, createDocenteDto.usuario_id));
      if (!usuario) {
        throw new NotFoundException(`Usuario con ID ${createDocenteDto.usuario_id} no encontrado`);
      }
      if (usuario.rol !== 'docente') {
        throw new ConflictException(
          `Usuario con ID ${createDocenteDto.usuario_id} no es un docente`
        );
      }
      const [docente] = await db.insert(docentes).values(createDocenteDto).returning();
      return docente;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'SQLITE_CONSTRAINT') {
        throw new ConflictException('Ya existe un docente con esa celula');
      }
      throw error;
    }
  }
  async findAll() {
    return await db.select().from(docentes);
  }
  async findOne(id: number) {
    const [docente] = await db.select().from(docentes).where(eq(docentes.id, id));
    if (!docente) {
      throw new NotFoundException(`Docente con ID ${id} no encontrado`);
    }
    return docente;
  }
  async update(id: number, updateDocenteDto: UpdateDocenteDto) {
    const [docente] = await db
      .update(docentes)
      .set(updateDocenteDto)
      .where(eq(docentes.id, id))
      .returning();
    if (!docente) {
      throw new NotFoundException(`Docente con ID ${id} no encontrado`);
    }
    return docente;
  }
  async remove(id: number) {
    const [docente] = await db.delete(docentes).where(eq(docentes.id, id)).returning();
    if (!docente) {
      throw new NotFoundException(`Docente con ID ${id} no encontrado`);
    }
    return docente;
  }
  async asignarGrupo(createDocenteGrupoDto: CreateDocenteGrupoDto) {
    try {
      const [docente] = await db
        .select()
        .from(usuarios)
        .where(
          and(
            eq(usuarios.id, Number(createDocenteGrupoDto.docente_id)),
            eq(usuarios.rol, 'docente')
          )
        );

      if (!docente) {
        throw new NotFoundException(
          `Docente con ID ${createDocenteGrupoDto.docente_id} no encontrado`
        );
      }

      // Verificar si el grupo existe
      const [grupo] = await db
        .select()
        .from(grupos)
        .where(eq(grupos.id, createDocenteGrupoDto.grupo_id));

      if (!grupo) {
        throw new NotFoundException(`Grupo con ID ${createDocenteGrupoDto.grupo_id} no encontrado`);
      }

      // Verificar si ya existe la asignación
      const [asignacionExistente] = await db
        .select()
        .from(docenteGrupos)
        .where(
          and(
            eq(docenteGrupos.docenteId, createDocenteGrupoDto.docente_id),
            eq(docenteGrupos.grupoId, createDocenteGrupoDto.grupo_id),
            eq(docenteGrupos.periodo, createDocenteGrupoDto.periodo)
          )
        );

      if (asignacionExistente) {
        throw new ConflictException('El docente ya está asignado a este grupo en este periodo');
      }

      // Crear la asignación
      const [asignacion] = await db
        .insert(docenteGrupos)
        .values({
          docenteId: createDocenteGrupoDto.docente_id,
          grupoId: createDocenteGrupoDto.grupo_id,
          materia: createDocenteGrupoDto.materia,
          periodo: createDocenteGrupoDto.periodo,
          estado: createDocenteGrupoDto.estado,
        })
        .returning();

      return asignacion;
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new Error(
        error instanceof Error ? error.message : 'Error desconocido al asignar grupo'
      );
    }
  }

  async actualizarAsignacion(id: number, updateDocenteGrupoDto: UpdateDocenteGrupoDto) {
    const [asignacion] = await db
      .update(docenteGrupos)
      .set(updateDocenteGrupoDto)
      .where(eq(docenteGrupos.id, id))
      .returning();

    if (!asignacion) {
      throw new NotFoundException(`Asignación con ID ${id} no encontrada`);
    }

    return asignacion;
  }

  async eliminarAsignacion(id: number) {
    const [asignacion] = await db.delete(docenteGrupos).where(eq(docenteGrupos.id, id)).returning();

    if (!asignacion) {
      throw new NotFoundException(`Asignación con ID ${id} no encontrada`);
    }

    return asignacion;
  }

  async obtenerGruposDocente(docenteId: number) {
    const asignaciones = await db
      .select({
        asignacion: docenteGrupos,
        grupo: grupos,
      })
      .from(docenteGrupos)
      .innerJoin(grupos, eq(grupos.id, docenteGrupos.grupoId))
      .where(eq(docenteGrupos.docenteId, docenteId));

    return asignaciones;
  }

  async obtenerDocentesPorGrupo(grupoId: number) {
    try {
      // Verificar si el grupo existe
      const [grupo] = await db.select().from(grupos).where(eq(grupos.id, grupoId));
      if (!grupo) {
        throw new NotFoundException(`Grupo #${grupoId} no encontrado`);
      }

      // Obtener todos los docentes del grupo con su información de usuario
      const docentesDelGrupo = await db
        .select({
          asignacion: docenteGrupos,
          usuario: usuarios,
        })
        .from(docenteGrupos)
        .innerJoin(usuarios, eq(usuarios.id, docenteGrupos.docenteId))
        .where(eq(docenteGrupos.grupoId, grupoId));

      // Combinar los datos
      return docentesDelGrupo.map((item) => ({
        id: item.asignacion.id, // ID de la asignación
        docente_id: item.asignacion.docenteId,
        grupo_id: item.asignacion.grupoId,
        materia: item.asignacion.materia,
        estado: item.asignacion.estado,
        periodo: item.asignacion.periodo,
        nombre: item.usuario.nombre,
        apellido_paterno: item.usuario.apellidoP,
        apellido_materno: item.usuario.apellidoM,
        email: item.usuario.correo,
      }));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(
        error instanceof Error ? error.message : 'Error desconocido al obtener docentes del grupo'
      );
    }
  }
}
