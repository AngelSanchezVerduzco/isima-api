import { IsInt, IsOptional, Min } from 'class-validator';

export class GenerarCodigoDto {
  @IsInt()
  @Min(1)
  grupoId: number;

  @IsInt()
  @Min(1)
  diasValidez: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxUsos?: number;
}
