import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateDocenteGrupoDto {
  @IsNotEmpty()
  @IsNumber()
  docente_id: number;

  @IsNotEmpty()
  @IsNumber()
  grupo_id: number;

  @IsNotEmpty()
  @IsString()
  materia: string;

  @IsNotEmpty()
  @IsString()
  periodo: string;

  @IsOptional()
  @IsString()
  estado?: 'activo' | 'inactivo' | 'suspendido';
}
