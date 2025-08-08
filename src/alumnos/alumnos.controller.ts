import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AlumnosService } from './alumnos.service';
import { CreateAlumnoDto } from './dto/create-alumno.dto';
import { UpdateAlumnoDto } from './dto/update-alumno.dto';
import { JoinClassDto } from './dto/join-class.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guard/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AsignarGrupoDto } from './dto/asignar-grupo.dto';

@Controller('alumnos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlumnosController {
  constructor(private readonly alumnosService: AlumnosService) {}

  @Post('CrearAlumno')
  @Roles('docente', 'administrativo')
  create(@Body() CreateAlumnoDto: CreateAlumnoDto) {
    return this.alumnosService.create(CreateAlumnoDto);
  }
  @Get('ObtenerTodosAlumnos')
  findAll() {
    return this.alumnosService.findAll();
  }
  @Post('BuscarAlumno')
  findOne(@Body() body: { id: number }) {
    return this.alumnosService.findOne(body.id);
  }
  @Post('ActualizarAlumno')
  @Roles('docente', 'administrativo')
  update(@Body() body: { id: number } & UpdateAlumnoDto) {
    return this.alumnosService.update(body.id, body);
  }
  @Post('EliminarAlumno')
  @Roles('docente', 'administrativo')
  remove(@Body() body: { id: number }) {
    return this.alumnosService.remove(body.id);
  }
  @Post('AsignarGrupo')
  @Roles('docente', 'administrativo')
  asignarGrupo(@Body() AsignarGrupoDto: AsignarGrupoDto) {
    return this.alumnosService.asignarGrupo(AsignarGrupoDto);
  }
  @Post('DesasignarGrupo')
  @Roles('docente', 'administrativo')
  desasignarGrupo(@Body() body: { alumno_id: number; grupo_id: number }) {
    return this.alumnosService.desasignarGrupo(body.alumno_id, body.grupo_id);
  }
  @Post('ObtenerGruposAlumno')
  obtenerGruposAlumno(@Body() body: { alumno_id: number }) {
    return this.alumnosService.ObtenerGruposAlumno(body.alumno_id);
  }

  @Get('grupo/:grupoId')
  obtenerAlumnosPorGrupo(@Param('grupoId') grupoId: string) {
    return this.alumnosService.obtenerAlumnosPorGrupo(+grupoId);
  }

  @Post('join-class')
  async joinClass(@Body() joinClassDto: JoinClassDto, @Request() req) {
    const usuarioId = req.user.id;
    console.log('Usuario en el guard (corregido): ', req.user);
    return this.alumnosService.joinClass(usuarioId, joinClassDto.codigo);
  }

  @Get('materias-docentes-grupos')
  async materiasDocentesGrupos(@Request() req) {
    const usuarioId = req.user.id;
    // Buscar el alumno por usuarioId
    const alumno = await this.alumnosService.findByUsuarioId(usuarioId);
    if (!alumno) {
      throw new Error('No se encontró el alumno para este usuario');
    }
    return this.alumnosService.obtenerMateriasYDocentesPorAlumno(alumno.id);
  }
}
