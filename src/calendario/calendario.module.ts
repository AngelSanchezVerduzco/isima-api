import { Module } from '@nestjs/common';
import { CalendarioController } from './calendario.controller';
import { CalendarioService } from './calendario.service';
import { NotificacionesModule } from '../notificaciones/notificaciones.module'; // Importa NotificacionesModule

@Module({
  imports: [NotificacionesModule], // Añade NotificacionesModule aquí
  controllers: [CalendarioController],
  providers: [CalendarioService],
})
export class CalendarioModule {}
