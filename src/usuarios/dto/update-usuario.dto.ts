import { IsString, IsOptional, IsEmail } from 'class-validator';
export class UpdateUsuarioDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  apellidoP?: string;
  @IsString()
  @IsOptional()
  apellidoM?: string;
  @IsEmail()
  @IsOptional()
  correo?: string;
}
