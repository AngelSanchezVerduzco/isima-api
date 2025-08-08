import { IsString, IsOptional } from 'class-validator';

export class CreateActividadDto {
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
