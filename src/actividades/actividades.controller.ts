import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ActividadesService } from './actividades.service';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Asumiendo que necesitas autenticación
import { RolesGuard } from '../auth/guard/roles.guard'; // Asumiendo que necesitas roles
import { Roles } from '../auth/decorators/roles.decorator'; // Asumiendo que necesitas roles

@Controller('actividades')
@UseGuards(JwtAuthGuard, RolesGuard) // Protege todo el controlador si solo los admins pueden gestionar actividades
@Roles('administrativo') // Solo los administrativos pueden gestionar actividades
export class ActividadesController {
  constructor(private readonly actividadesService: ActividadesService) {}

  @Post()
  create(@Body() createActividadDto: CreateActividadDto) {
    return this.actividadesService.create(createActividadDto);
  }

  @Get()
  findAll() {
    return this.actividadesService.findAll();
  }

  @Get(':id') // Usar @Param para IDs en la URL es más RESTful
  findOne(@Param('id') id: string) {
    return this.actividadesService.findOne(+id); // Convertir ID a número
  }

  @Patch(':id') // Usar PATCH para actualizaciones parciales
  update(@Param('id') id: string, @Body() updateActividadDto: UpdateActividadDto) {
    return this.actividadesService.update(+id, updateActividadDto);
  }

  @Delete(':id') // Usar DELETE para eliminar
  remove(@Param('id') id: string) {
    return this.actividadesService.remove(+id);
  }

  // Endpoint para obtener actividades predefinidas (si implementas el método en el servicio)
  // @Get('predefinidas')
  // @Public() // Si quieres que este endpoint sea público
  // findPredefinidas() {
  //   return this.actividadesService.findPredefinidas();
  // }
}
