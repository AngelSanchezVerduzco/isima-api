import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { UsuariosService } from '../usuarios/usuarios.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { and, eq, gt, sql } from 'drizzle-orm'; // Importar 'sql' aquí
import { randomBytes } from 'crypto';
import { db } from '../database/config';
import { refreshTokens, usuarios, resetTokens } from '../database/schema';
import { AlumnosService } from '../alumnos/alumnos.service'; // Importar AlumnosService

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService, // Necesitaremos agregar este servicio
    private readonly alumnosService: AlumnosService // Inyectar AlumnosService
  ) {}

  async register(data: RegisterDto) {
    try {
      const hashedPassword = await bcrypt.hash(data.contraseña, 10);
      const usuario = await this.usuariosService.create({
        ...data,
        contraseña: hashedPassword,
        rol: data.rol || 'alumno',
      });
      return usuario;
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        'code' in err &&
        err.code === 'SQLITE_CONSTRAINT' &&
        err.message?.includes('usuarios.correo')
      ) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
      throw err;
    }
  }

  async validateUser(correo: string, matriculaRecibida: string) {
    const usuario = await this.usuariosService.findByCorreo(correo);
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Buscar el alumno por usuario_id
    const alumno = await this.alumnosService.findByUsuarioId(usuario.id);

    if (!alumno) {
        // Esto podría pasar si un usuario no es un alumno (ej: docente, admin)
        // En este caso, puedes decidir cómo manejarlo. 
        // Por ahora, lanzaré un error, pero podrías autenticar a otros roles de otra forma.
        throw new UnauthorizedException('Usuario no es un alumno o matrícula no encontrada');
    }

    // Comparar la matrícula recibida con la matrícula del alumno
    const isMatriculaValid = matriculaRecibida === alumno.matricula;

    if (!isMatriculaValid) {
      throw new UnauthorizedException('Matrícula incorrecta');
    }

    // Usamos type assertion para evitar el error de TypeScript
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contraseña: passwordOmitted, ...rest } = usuario;
    return rest;
  }

  async login(data: LoginDto) {
    try {
      // Ahora validateUser usa correo y matrícula
      const usuario = await this.validateUser(data.correo, data.contraseña); 

      const accessToken = this.generateAccessToken(usuario);
      const refreshToken = await this.generateRefreshToken(usuario.id);

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        usuario,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Error en el proceso de login');
    }
  }

  private generateAccessToken(usuario: { id: number; rol: string; nombre: string }) {
    const payload = { sub: usuario.id, rol: usuario.rol, nombre: usuario.nombre };
    return this.jwtService.sign(payload, {
      expiresIn: '15m',
    });
  }

  private async generateRefreshToken(usuarioId: number) {
    try {
      const token = randomBytes(40).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await db.insert(refreshTokens).values({
        token,
        usuarioId,
        expiresAt: expiresAt.toISOString(),
      });

      return token;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new UnauthorizedException('Error al generar refresh token');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const [token] = await db
        .select()
        .from(refreshTokens)
        .where(
          and(
            eq(refreshTokens.token, refreshToken),
            eq(refreshTokens.revoked, false),
            gt(refreshTokens.expiresAt, new Date().toISOString())
          )
        );

      if (!token) {
        throw new UnauthorizedException('Token de actualización inválido');
      }

      const [usuario] = await db.select().from(usuarios).where(eq(usuarios.id, token.usuarioId));

      if (!usuario) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      const accessToken = this.generateAccessToken({
        id: usuario.id,
        rol: usuario.rol,
        nombre: usuario.nombre,
      });

      return {
        access_token: accessToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Error al refrescar el token');
    }
  }

  async logout(refreshToken: string) {
    try {
      const [token] = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.token, refreshToken));

      if (!token) {
        throw new UnauthorizedException('Token no encontrado');
      }

      // Marcar el token como revocado
      await db
        .update(refreshTokens)
        .set({ revoked: true })
        .where(eq(refreshTokens.token, refreshToken));

      return { message: 'Sesión cerrada exitosamente' };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Error al cerrar sesión');
    }
  }

  async revokeAllUserTokens(usuarioId: number) {
    try {
      await db
        .update(refreshTokens)
        .set({ revoked: true })
        .where(eq(refreshTokens.usuarioId, usuarioId));

      return { message: 'Todos los tokens han sido revocados' };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new UnauthorizedException('Error al revocar tokens');
    }
  }
  async forgotPassword(correo: string) {
    const usuario = await this.usuariosService.findByCorreo(correo);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Generar token de recuperación (válido por 1 hora)
    console.log('Signing token with secret:', process.env.JWT_RESET_SECRET); // <-- Agregar este log
    const resetToken = this.jwtService.sign(
      { id: usuario.id },
      { expiresIn: '1h', secret: process.env.JWT_RESET_SECRET }
    );

    // Guardar el token en la base de datos
    await db.insert(resetTokens).values({
      usuarioId: usuario.id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hora
    });

    // Enviar correo con SendGrid
    await this.mailerService.sendMail({
      to: correo,
      subject: 'Recuperación de Contraseña - ISIMA',
      html: `
        <h1>Recuperación de Contraseña</h1>
        <p>Has solicitado restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}">
          Restablecer Contraseña
        </a>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste este cambio, ignora este correo.</p>
      `,
    });

    return { message: 'Se ha enviado un correo con las instrucciones' };
  }

  async resetPassword(resetToken: string, nuevaContraseña: string) {
    try {
      console.log('Received reset token:', resetToken);
      console.log('Verifying token with secret:', process.env.JWT_RESET_SECRET);

      const payload = this.jwtService.verify(resetToken, {
        secret: process.env.JWT_RESET_SECRET,
      });
      console.log('JWT Payload:', payload);

      const [token] = await db
        .select()
        .from(resetTokens)
        .where(
          and(
            eq(resetTokens.token, resetToken),
            eq(resetTokens.usado, false),
            gt(resetTokens.expiresAt, new Date().toISOString())
          )
        );

      console.log('Database token result:', token);

      if (!token) {
        console.error('Token not found, used, or expired in DB');
        throw new UnauthorizedException('Token inválido o expirado');
      }

      const hashedPassword = await bcrypt.hash(nuevaContraseña, 10);
      await this.usuariosService.updatePassword(payload.id, hashedPassword);

      // Usar el método correcto para ejecutar SQL sin formato
      await db.run(sql`UPDATE reset_tokens SET usado = 1 WHERE token = ${resetToken}`);

      return { message: 'Contraseña actualizada exitosamente' };
    } catch (error) {
      console.error('Error during password reset:', error);
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
