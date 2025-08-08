import { IsOptional, IsNumber, IsString, IsBoolean, IsDateString } from 'class-validator';
export class FilterSalonesDto {
  @IsOptional()
  @IsNumber()
  capacidadMinima?: number;
  @IsOptional()
  @IsString()
  edificio?: string;
  @IsOptional()
  @IsBoolean()
  disponible?: boolean;
  @IsOptional()
  @IsString()
  dia?: string;
  @IsOptional()
  @IsDateString()
  horaInicio?: Date;
  @IsOptional()
  @IsDateString()
  horaFin?: Date;
}
