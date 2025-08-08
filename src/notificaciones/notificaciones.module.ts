import { Module } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionesController } from './notificaciones.controller';
// ... otras importaciones si las hay ...

@Module({
  imports: [
    // ... otros módulos importados si los hay ...
  ],
  controllers: [NotificacionesController],
  providers: [NotificacionesService],
  exports: [NotificacionesService], // <-- Añade NotificacionesService aquí
})
export class NotificacionesModule {}
