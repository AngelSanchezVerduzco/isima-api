import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { DocentesService } from './docentes.service';
import { CreateDocenteDto } from './dto/create-docente.dto';
import { UpdateDocenteDto } from './dto/update-docente.dto';
import { CreateDocenteGrupoDto } from './dto/create-docente-grupo.dto';
import { UpdateDocenteGrupoDto } from './dto/update-docente-grupo.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guard/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('docentes')
export class DocentesController {
  constructor(private readonly docentesService: DocentesService) {}
  @Post('CrearDocente')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrativo')
  create(@Body() CreateDocenteDto: CreateDocenteDto) {
    return this.docentesService.create(CreateDocenteDto);
  }
  @Get('ObtenerTodosDocentes')
  findAll() {
    return this.docentesService.findAll();
  }
  @Post('BuscarDocenteID')
  findOne(@Body() body: { id: number }) {
    return this.docentesService.findOne(body.id);
  }

  @Post('ActualizarDocente')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrativo')
  update(@Body() body: { id: number } & UpdateDocenteDto) {
    return this.docentesService.update(body.id, body);
  }
  @Post('EliminarDocente')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrativo')
  remove(@Body() body: { id: number }) {
    return this.docentesService.remove(body.id);
  }

  @Post('AsignarGrupo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrativo', 'docente')
  asignarGrupo(@Body() createDocenteGrupoDto: CreateDocenteGrupoDto) {
    return this.docentesService.asignarGrupo(createDocenteGrupoDto);
  }

  @Post('ActualizarAsignacion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrativo', 'docente')
  actualizarAsignacion(@Body() body: { id: number } & UpdateDocenteGrupoDto) {
    return this.docentesService.actualizarAsignacion(body.id, body);
  }

  @Post('EliminarAsignacion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrativo', 'docente')
  eliminarAsignacion(@Body() body: { id: number }) {
    return this.docentesService.eliminarAsignacion(body.id);
  }

  @Post('ObtenerGruposDocente')
  obtenerGruposDocente(@Body() body: { docente_id: number }) {
    return this.docentesService.obtenerGruposDocente(body.docente_id);
  }

  @Get('grupo/:grupoId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrativo', 'docente')
  obtenerDocentesPorGrupo(@Param('grupoId') grupoId: string) {
    return this.docentesService.obtenerDocentesPorGrupo(+grupoId);
  }
}
