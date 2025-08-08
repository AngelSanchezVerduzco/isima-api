import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { CalendarioService } from './calendario.service';
import { CreateCalendarioDto } from './dto/create-calendario.dto';
import { UpdateCalendarioDto } from './dto/update-calendario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('calendario')
export class CalendarioController {
  constructor(private readonly calendarioService: CalendarioService) {}

  // Endpoints que requieren autenticación y rol de docente
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createCalendarioDto: CreateCalendarioDto, @GetUser() user) {
    return this.calendarioService.create(createCalendarioDto, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateCalendarioDto: UpdateCalendarioDto,
    @GetUser() user
  ) {
    return this.calendarioService.update(+id, updateCalendarioDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @GetUser() user) {
    return this.calendarioService.remove(+id, user);
  }

  // Endpoints públicos para consulta
  @Get()
  findAll() {
    return this.calendarioService.findAll();
  }

  // Nuevo endpoint para filtrar por rango de fechas (basado en el método findByDateRange del servicio)
  @Get('rango-fechas')
  findByDateRange(
    @Query('fechaInicio') fechaInicio: string, // Requerido para este endpoint
    @Query('fechaFin') fechaFin: string // Requerido para este endpoint
  ) {
    // Asegúrate de que las fechas se pasen en formato YYYY-MM-DD si el servicio espera strings
    return this.calendarioService.findByDateRange(fechaInicio, fechaFin);
  }

  @Get('pendientes')
  findEventosPendientes() {
    return this.calendarioService.findEventosPendientes();
  }

  @Get('grupo/:id')
  findEventosGrupo(@Param('id') id: string) {
    return this.calendarioService.findEventosGrupo(+id);
  }

  // Nuevo endpoint para notificaciones pendientes (basado en el método findEventosConNotificacionPendiente del servicio)
  @Get('notificaciones-pendientes')
  findEventosConNotificacionPendiente() {
    return this.calendarioService.findEventosConNotificacionPendiente();
  }

  @Get('buzon')
  @UseGuards(JwtAuthGuard)
  async getBuzonEventos(@Request() req) {
    // El usuario autenticado
    const usuarioId = req.user.id;
    return this.calendarioService.getEventosBuzonParaUsuario(usuarioId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.calendarioService.findOne(+id);
  }
}
