import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
export class LoginDto {
  @IsNotEmpty()
  @IsEmail()
  correo: string;

  @IsNotEmpty()
  @IsString()
  contraseña: string;
}
