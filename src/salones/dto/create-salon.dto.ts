import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
export class CreateSalonDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  @IsOptional()
  capacidad?: number;

  @IsString()
  @IsOptional()
  edificio?: string;

  @IsBoolean()
  @IsOptional()
  disponible?: boolean;
}
