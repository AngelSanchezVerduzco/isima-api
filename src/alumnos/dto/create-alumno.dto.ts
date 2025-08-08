import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
export class CreateAlumnoDto {
  @IsNotEmpty()
  @IsNumber()
  usuario_id: string;

  @IsNotEmpty()
  @IsString()
  matricula: string;

  @IsOptional()
  @IsEnum(['activo', 'inactivo'])
  estado?: 'activo' | 'inactivo';
}
