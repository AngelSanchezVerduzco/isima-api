import { IsNumber, IsString, IsOptional, IsEnum, IsDate } from 'class-validator';

// Define los tipos de notificación permitidos
export enum NotificationType {
  Gmail = 'gmail',
  Push = 'push',
  InApp = 'in-app',
}

// Define los estados de notificación permitidos
enum NotificationStatus {
  Pendiente = 'pendiente',
  Enviada = 'enviada',
  Fallida = 'fallida',
}

export class CreateNotificationDto {
  @IsNumber()
  calendarioId: number;

  @IsEnum(NotificationType)
  tipo: NotificationType; // O tipo: 'in-app' | 'otro-tipo'; si no usas enum
  cuerpo?: string | null; // Permitir null

  @IsOptional()
  @IsNumber()
  remitenteUsuarioId?: number;

  @IsOptional()
  @IsNumber()
  destinatarioUsuarioId?: number;

  @IsOptional()
  @IsNumber()
  destinatarioGrupoId?: number;

  @IsOptional() // El estado por defecto es 'pendiente' en el esquema
  @IsEnum(NotificationStatus)
  estado?: NotificationStatus;

  @IsOptional() // La fecha de creación tiene un valor por defecto
  @IsDate()
  fechaCreacion?: Date;

  @IsOptional()
  @IsDate()
  fechaEnvio?: Date;

  @IsString()
  titulo: string;
}
