import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
export class CreateDocenteDto {
  @IsNotEmpty()
  @IsNumber()
  usuario_id: number;

  @IsOptional()
  @IsString()
  especialidad?: string;

  @IsOptional()
  @IsString()
  cedula?: string;

  @IsOptional()
  @IsString()
  titulo?: string;
}
