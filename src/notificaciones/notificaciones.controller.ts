import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Asumiendo que necesitas autenticación

@Controller('notificaciones')
@UseGuards(JwtAuthGuard) // Protege el controlador para que solo usuarios autenticados vean sus notificaciones
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get('usuario/:userId') // Endpoint para obtener notificaciones de un usuario específico
  // Considera si el usuario autenticado puede ver notificaciones de OTROS usuarios
  // Podrías querer obtener el ID del usuario del token JWT en lugar de un parámetro de URL
  findUserNotifications(@Param('userId') userId: string) {
    return this.notificacionesService.findUserNotifications(+userId);
  }

  // Endpoint alternativo para obtener notificaciones del usuario autenticado
  // @Get('me')
  // findMyNotifications(@Req() req) {
  //   const userId = req.user.id; // Asumiendo que el ID del usuario está en el objeto 'user' del request después del JwtAuthGuard
  //   return this.notificacionesService.findUserNotifications(userId);
  // }

  // Endpoint para marcar una notificación como leída (si implementas la lógica)
  // @Patch(':id/read')
  // markAsRead(@Param('id') id: string) {
  //   return this.notificacionesService.markAsRead(+id);
  // }
}
