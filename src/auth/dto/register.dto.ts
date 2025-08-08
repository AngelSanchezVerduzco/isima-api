export class RegisterDto {
  nombre: string;
  correo: string;
  contraseña: string;
  apellidoP?: string;
  apellidoM?: string;
  rol?: 'alumno' | 'docente' | 'administrativo';
}
