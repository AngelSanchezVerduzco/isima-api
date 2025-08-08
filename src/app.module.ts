import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';

import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { CalendarioModule } from './calendario/calendario.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { SalonesModule } from './salones/salones.module';
import { HorariosModule } from './horarios/horarios.module';
import { GruposModule } from './grupos/grupos.module';
import { ActividadesModule } from './actividades/actividades.module';
import { AlumnosModule } from './alumnos/alumnos.module';
import { DocentesModule } from './docentes/docentes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsuariosModule,
    CalendarioModule,
    NotificacionesModule,
    SalonesModule,
    HorariosModule,
    GruposModule,
    ActividadesModule,
    AlumnosModule,
    DocentesModule,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          service: 'SendGrid',
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY,
          },
        },
        defaults: {
          from: process.env.MAIL_FROM,
        },
      }),
    }),
  ],
})
export class AppModule {}
