import { IsNotEmpty, IsString, IsNumber, IsEnum } from 'class-validator';

enum DiaSemana {
  LUNES = 'LUNES',
  MARTES = 'MARTES',
  MIERCOLES = 'MIERCOLES',
  JUEVES = 'JUEVES',
  VIERNES = 'VIERNES',
  SABADO = 'SABADO',
  DOMINGO = 'DOMINGO',
}

export class CreateHorarioSlotDto {
  @IsNumber()
  @IsNotEmpty()
  horarioId: number;

  @IsEnum(DiaSemana, {
    message: 'El día debe ser uno de: LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO',
  })
  dia: DiaSemana;

  @IsString()
  @IsNotEmpty()
  horaInicio: string;

  @IsString()
  @IsNotEmpty()
  horaFin: string;

  @IsNumber()
  @IsNotEmpty()
  salonId: number;

  @IsString()
  @IsNotEmpty()
  materia: string;
}
