export class CreateGrupoDto {
  nombre: string;
  descripcion?: string;
  semestre: number;
  turno: 'matutino' | 'vespertino';
  anio_escolar: string;
  estado?: 'activo' | 'inactivo';
}
