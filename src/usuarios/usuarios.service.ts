import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { db } from '../database/config';
import { usuarios, alumnos, grupos_alumnos, grupos } from '../database/schema';
import { eq, count } from 'drizzle-orm';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  async create(data: RegisterDto) {
    const [usuario] = await db
      .insert(usuarios)
      .values({
        nombre: data.nombre,
        apellidoP: '',
        apellidoM: '',
        correo: data.correo,
        contraseña: data.contraseña,
        rol: 'alumno',
      })
      .returning();
    if (usuario) {
      usuario.contraseña = '';
    }
    return usuario;
  }
  async findByCorreo(correo: string) {
    const [usuario] = await db.select().from(usuarios).where(eq(usuarios.correo, correo));
    return usuario || null;
  }
  async findAll() {
    return await db.select().from(usuarios);
  }

  async findById(id: number) {
    const [usuario] = await db.select().from(usuarios).where(eq(usuarios.id, id));
    if (usuario) {
      usuario.contraseña = '';
    }
    return usuario;
  }

  async findMe(id: number) {
    const [usuario] = await db.select().from(usuarios).where(eq(usuarios.id, id));
    if (usuario) {
      usuario.contraseña = '';
    }
    return usuario;
  }
  async findDocentes() {
    const docentes = await db.select().from(usuarios).where(eq(usuarios.rol, 'docente'));
    return docentes.map((docente) => {
      docente.contraseña = '';
      return docente;
    });
  }
  async findAlumnos() {
    const alumnos = await db.select().from(usuarios).where(eq(usuarios.rol, 'alumno'));
    return alumnos.map((alumno) => {
      alumno.contraseña = '';
      return alumno;
    });
  }

  async getTotalAlumnos() {
    const [result] = await db
      .select({ count: count() })
      .from(usuarios)
      .where(eq(usuarios.rol, 'alumno'));
    return result.count;
  }

  async getTotalDocentes() {
    const [result] = await db
      .select({ count: count() })
      .from(usuarios)
      .where(eq(usuarios.rol, 'docente'));
    return result.count;
  }

  async getTotalAdministrativos() {
    const [result] = await db
      .select({ count: count() })
      .from(usuarios)
      .where(eq(usuarios.rol, 'administrativo'));
    return result.count;
  }
  async update(id: number, data: UpdateUsuarioDto) {
    const [usuario] = await db.update(usuarios).set(data).where(eq(usuarios.id, id)).returning();
    if (usuario) {
      usuario.contraseña = '';
    }
    return usuario;
  }
  async updatePassword(userId: number, hashedPassword: string) {
    await db.update(usuarios).set({ contraseña: hashedPassword }).where(eq(usuarios.id, userId));
  }

  async findAlumnoByUsuarioId(usuarioId: number) {
    const [alumno] = await db.select().from(alumnos).where(eq(alumnos.usuario_id, usuarioId));
    return alumno || null;
  }

  async getPerfilCompletoAlumno(usuarioId: number) {
    // Obtener información del usuario
    const [usuario] = await db.select().from(usuarios).where(eq(usuarios.id, usuarioId));
    
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Obtener información del alumno
    const [alumno] = await db.select().from(alumnos).where(eq(alumnos.usuario_id, usuarioId));
    
    if (!alumno) {
      throw new NotFoundException('Alumno no encontrado');
    }

    // Obtener los grupos del alumno
    const gruposAlumno = await db
      .select({ 
        grupoId: grupos_alumnos.grupo_id,
        grupoNombre: grupos.nombre 
      })
      .from(grupos_alumnos)
      .innerJoin(grupos, eq(grupos_alumnos.grupo_id, grupos.id))
      .where(eq(grupos_alumnos.alumno_id, alumno.id));

    // Construir el nombre completo
    const nombreCompleto = `${usuario.nombre} ${usuario.apellidoP} ${usuario.apellidoM}`.trim();

    return {
      id: usuario.id,
      nombreCompleto: nombreCompleto,
      correo: usuario.correo,
      rol: usuario.rol,
      grupos: gruposAlumno.length > 0 ? gruposAlumno : [],
      estaRegistrado: gruposAlumno.length > 0
    };
  }
}
