import { Controller, Get, Put, UseGuards, Request, Body, Post } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UsuariosService } from './usuarios.service';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

export interface RequestWithUser extends Request {
  user: {
    id: number;
  };
}
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}
  @UseGuards(JwtAuthGuard)
  @Get()
  findall() {
    return this.usuariosService.findAll();
  }

  @Post('perfil')
  async findById(@Body() body: { id: number }) {
    return this.usuariosService.findById(body.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('perfil')
  async findMe(@Request() req: RequestWithUser) {
    console.log(req.user);
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    return this.usuariosService.findMe(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('perfil-completo')
  async getPerfilCompleto(@Request() req: RequestWithUser) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    return this.usuariosService.getPerfilCompletoAlumno(userId);
  }

  @Get('docentes')
  findDocentes() {
    return this.usuariosService.findDocentes();
  }
  @Get('alumnos')
  findAlumnos() {
    return this.usuariosService.findAlumnos();
  }

  @Post('total/alumnos')
  getTotalAlumnos(@Body() body: any) {
    return this.usuariosService.getTotalAlumnos();
  }

  @Post('total/docentes')
  getTotalDocentes(@Body() body: any) {
    return this.usuariosService.getTotalDocentes();
  }

  @Post('total/administrativos')
  getTotalAdministrativos(@Body() body: any) {
    return this.usuariosService.getTotalAdministrativos();
  }

  @UseGuards(JwtAuthGuard)
  @Put('UpdatePerfil')
  update(@Request() req: RequestWithUser, @Body() data: UpdateUsuarioDto) {
    const userId = req.user?.id; // Asegúrate de que 'id' está presente
    console.log(req.user);
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    return this.usuariosService.update(userId, data);
  }
}
