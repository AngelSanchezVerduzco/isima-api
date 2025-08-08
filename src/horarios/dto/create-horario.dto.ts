import { IsNotEmpty, IsString, IsNumber, IsBoolean } from 'class-validator';
export class CreateHorarioDto {
  @IsNumber()
  @IsNotEmpty()
  grupoId: number;

  @IsString()
  @IsNotEmpty()
  periodo: string;

  @IsBoolean()
  activo: boolean;
}
