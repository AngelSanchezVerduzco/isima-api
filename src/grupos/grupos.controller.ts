import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { GruposService } from './grupos.service';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { UpdateGrupoDto } from './dto/update-grupo.dto';
import { GenerarCodigoDto } from './dto/generar-codigo.dto';
import { UnirseGrupoDto } from './dto/unirse-grupo.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guard/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('grupos')
export class GruposController {
  constructor(private readonly gruposService: GruposService) {}
  @Post('CrearGrupo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('docente', 'administrativo')
  create(@Body() createGrupoDto: CreateGrupoDto) {
    return this.gruposService.create(createGrupoDto);
  }

  @Get()
  findAll() {
    return this.gruposService.findAll();
  }

  @Post('estado')
  findByEstado(@Body() body: { estado: 'activo' | 'inactivo' }) {
    return this.gruposService.findByEstado(body.estado);
  }

  @Post('semestre')
  findBySemestre(@Body() body: { semestre: number }) {
    return this.gruposService.findBySemestre(body.semestre);
  }

  @Post('turno')
  findByTurno(@Body() body: { turno: 'matutino' | 'vespertino' }) {
    return this.gruposService.findByTurno(body.turno);
  }

  @Post('anio-escolar')
  findByAnioEscolar(@Body() body: { anio_escolar: string }) {
    return this.gruposService.findByAnioEscolar(body.anio_escolar);
  }
  @Post('nombre')
  findByNombre(@Body() body: { nombre: string }) {
    return this.gruposService.findByNombre(body.nombre);
  }

  @Post('buscar')
  async findOne(@Body() body: { id: number }) {
    return this.gruposService.findOne(body.id);
  }

  @Post('docente')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('docente', 'administrativo')
  findByDocente(@Body() body: { docenteId: number }) {
    return this.gruposService.findByDocente(body.docenteId);
  }

  @Post('docente/estado')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('docente', 'administrativo')
  findByDocenteAndEstado(@Body() body: { docenteId: number; estado: 'activo' | 'inactivo' }) {
    return this.gruposService.findByDocenteAndEstado(body.docenteId, body.estado);
  }

  @Post('docente/anio-escolar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('docente', 'administrativo')
  findByDocenteAndAnioEscolar(@Body() body: { docenteId: number; anio_escolar: string }) {
    return this.gruposService.findByDocenteAndAnioEscolar(body.docenteId, body.anio_escolar);
  }

  @Post('docente/nombre')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('docente', 'administrativo')
  findByDocenteAndNombre(@Body() body: { docenteId: number; nombre: string }) {
    return this.gruposService.findByDocenteAndNombre(body.docenteId, body.nombre);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('docente', 'administrativo')
  update(@Param('id') id: string, @Body() updateGrupoDto: UpdateGrupoDto) {
    return this.gruposService.update(+id, updateGrupoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('docente', 'administrativo')
  remove(@Param('id') id: string) {
    return this.gruposService.remove(+id);
  }

  @Get('total/grupos')
  getTotalGrupos() {
    return this.gruposService.getTotalGrupos();
  }

  @Post('generar-codigo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('docente', 'administrativo')
  generarCodigoInvitacion(
    @Body() generarCodigoDto: GenerarCodigoDto,
    @Request() req: RequestWithUser
  ) {
    // Asegurar que el ID se interprete como número
    const userId = Number(req.user.id);
    return this.gruposService.generarCodigoInvitacion(
      generarCodigoDto.grupoId,
      userId,
      generarCodigoDto.diasValidez,
      generarCodigoDto.maxUsos
    );
  }

  @Post('unirse')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('alumno')
  unirseAGrupo(@Body() unirseGrupoDto: UnirseGrupoDto, @Request() req: RequestWithUser) {
    // Asegurar que el ID se interprete como número
    const userId = Number(req.user.id);
    return this.gruposService.unirseAGrupo(unirseGrupoDto.codigo, userId);
  }
}
