import { IsNotEmpty, IsString, Length } from 'class-validator';

export class UnirseGrupoDto {
  @IsString()
  @IsNotEmpty()
  @Length(8, 8)
  codigo: string;
}
