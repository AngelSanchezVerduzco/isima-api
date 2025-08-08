import { PartialType } from '@nestjs/mapped-types';
import { CreateDocenteGrupoDto } from './create-docente-grupo.dto';

export class UpdateDocenteGrupoDto extends PartialType(CreateDocenteGrupoDto) {}
