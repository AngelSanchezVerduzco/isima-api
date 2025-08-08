import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SalonesService } from './salones.service';
import { CreateSalonDto } from './dto/create-salon.dto';
import { FilterSalonesDto } from './dto/filter-salones.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('salones')
export class SalonesController {
  constructor(private readonly salonesService: SalonesService) {}

  @Post('CrearSalon')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrativo')
  create(@Body() CreateSalonDto: CreateSalonDto) {
    return this.salonesService.create(CreateSalonDto);
  }

  @Get('ListarSalones')
  findAll() {
    return this.salonesService.findAll();
  }

  @Get('buscarSalonID')
  findOne(@Body() body: { id: number }) {
    return this.salonesService.findOne(body.id);
  }

  @Post('actualizar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrativo')
  update(@Body() body: { id: number } & Partial<CreateSalonDto>) {
    const { id, ...updateSalonDto } = body;
    return this.salonesService.update(id, updateSalonDto);
  }

  @Post('eliminar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrativo')
  remove(@Body() body: { id: number }) {
    return this.salonesService.remove(body.id);
  }

  @Post('filtrar') // Cambiado a POST
  filter(@Body() filterDto: FilterSalonesDto) {
    return this.salonesService.filter(filterDto);
  }
}
