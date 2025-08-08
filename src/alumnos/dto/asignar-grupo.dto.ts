import { IsNotEmpty, IsNumber } from 'class-validator';
export class AsignarGrupoDto {
  @IsNotEmpty()
  @IsNumber()
  alumno_id: number;

  @IsNotEmpty()
  @IsNumber()
  grupo_id: number;
}
