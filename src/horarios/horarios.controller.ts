import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { HorariosService } from './horarios.service';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { CreateHorarioSlotDto } from './dto/create-horario-slot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    id: number; // Cambiado de userId a id
  };
}

@Controller('horarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HorariosController {
  constructor(private readonly horariosService: HorariosService) {}

  @Post('HorarioBase')
  @Roles('administrativo')
  create(@Body() createHorarioDto: CreateHorarioDto) {
    return this.horariosService.create(createHorarioDto);
  }

  @Post('slot')
  @Roles('administrativo')
  createSlot(@Body() createHorarioSlotDto: CreateHorarioSlotDto) {
    return this.horariosService.createSlot(createHorarioSlotDto);
  }

  @Get('ListarHorariosBase')
  findAll() {
    return this.horariosService.findAll();
  }

  @Post('buscar')
  findOne(@Body() body: { id: number }) {
    return this.horariosService.findOne(body.id);
  }

  @Post('SlotsHorario')
  findSlots(@Body() body: { horarioId: number }) {
    return this.horariosService.findSlotsByHorario(body.horarioId);
  }

  @Post('actualizar')
  @Roles('administrativo')
  update(@Body() body: { id: number } & Partial<CreateHorarioDto>) {
    const { id, ...updateHorarioDto } = body;
    return this.horariosService.update(id, updateHorarioDto);
  }

  @Post('eliminar')
  @Roles('administrativo')
  remove(@Body() body: { id: number }) {
    return this.horariosService.remove(body.id);
  }

  @Post('eliminarSlot')
  @Roles('administrativo')
  removeSlot(@Body() body: { id: number }) {
    return this.horariosService.removeSlot(body.id);
  }

  @Get('miHorario')
  @UseGuards(JwtAuthGuard)
  findScheduleForUser(@Req() req: RequestWithUser): Promise<any[]> {
    const userId: number = req.user.id; // Cambiado de userId a id
    return this.horariosService.findScheduleForUser(userId);
  }

  @Get('horario-grupo-alumno')
  @UseGuards(JwtAuthGuard)
  async getHorarioGrupoAlumno(@Req() req: RequestWithUser) {
    const userId: number = req.user.id;
    return this.horariosService.getHorarioGrupoAlumno(userId);
  }
}
