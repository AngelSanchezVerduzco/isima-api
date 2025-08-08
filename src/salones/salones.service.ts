/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { db } from '../database/config';
import { salones, horarioSlots } from '../database/schema'; // Importa horarioSlots
import { CreateSalonDto } from './dto/create-salon.dto';
import { FilterSalonesDto } from './dto/filter-salones.dto'; // Importa el nuevo DTO
import { eq, and, between, sql, gt, like } from 'drizzle-orm'; // Importa sql, gt, like

@Injectable()
export class SalonesService {
  async create(createSalonDto: CreateSalonDto) {
    try {
      const [salon] = await db.insert(salones).values(createSalonDto).returning();
      return {
        mensaje: 'Salon creado exitosamente',
        datos: salon,
      };
    } catch (error) {
      throw new BadRequestException('Error al crear el salon');
    }
  }
  async findAll() {
    return await db.select().from(salones);
  }
  async findOne(id: number) {
    const [salon] = await db.select().from(salones).where(eq(salones.id, id));
    if (!salon) {
      throw new NotFoundException('Salon no encontrado');
    }
    return salon;
  }
  async update(id: number, updateSalonDto: Partial<CreateSalonDto>) {
    const [salon] = await db
      .update(salones)
      .set(updateSalonDto)
      .where(eq(salones.id, id))
      .returning();
    if (!salon) {
      throw new NotFoundException('Salon no encontrado');
    }
    return {
      mensaje: 'Salon actualizado exitosamente',
      datos: salon,
    };
  }
  async remove(id: number) {
    const [salon] = await db.delete(salones).where(eq(salones.id, id)).returning();
    if (!salon) {
      throw new NotFoundException('Salon no encontrado');
    }
    return {
      mensaje: 'Salon eliminado exitosamente',
      datos: salon,
    };
  }
  async filter(filterDto: FilterSalonesDto) {
    let query = db.select().from(salones).where(eq(salones.disponible, true)).as('s');

    if (filterDto.capacidadMinima !== undefined) {
      query = db
        .select()
        .from(query)
        .where(gt(sql`${query.capacidad}`, filterDto.capacidadMinima))
        .as('s');
    }
    if (filterDto.edificio) {
      query = db
        .select()
        .from(query)
        .where(like(sql`${query.edificio}`, `%${filterDto.edificio}%`))
        .as('s');
    }
    if (filterDto.disponible !== undefined) {
      query = db
        .select()
        .from(query)
        .where(eq(sql`${query.disponible}`, filterDto.disponible))
        .as('s');
    }

    if (filterDto.dia && filterDto.horaInicio && filterDto.horaFin) {
      const salonesOcupados = db
        .select({ id: horarioSlots.salonId })
        .from(horarioSlots)
        .where(
          and(
            eq(horarioSlots.dia, filterDto.dia.toUpperCase()),
            sql`${horarioSlots.horaInicio} < ${filterDto.horaFin}`,
            sql`${horarioSlots.horaFin} > ${filterDto.horaInicio}`
          )
        )
        .as('so');

      // Seleccionar *solo* las columnas de salones y filtrar donde no hay coincidencia
      const availableSalones = await db
        .select({
          // <--- Modificación aquí para seleccionar solo las columnas de salones
          id: sql`${query.id}`,
          nombre: sql`${query.nombre}`,
          capacidad: sql`${query.capacidad}`,
          edificio: sql`${query.edificio}`,
          disponible: sql`${query.disponible}`,
        })
        .from(query)
        .leftJoin(salonesOcupados, eq(sql`${query.id}`, salonesOcupados.id))
        .where(sql`${salonesOcupados.id} IS NULL`);

      return availableSalones; // Esto ahora devolverá un array de objetos de salón limpios
    } else {
      // Si no se especifica rango de tiempo, solo aplicar filtros de capacidad/edificio/disponibilidad
      // Aquí también podrías querer seleccionar solo las columnas de salones si 'query' aún las tiene anidadas
      return await db.select().from(query); // O ajustar la selección si es necesario
    }
  }
}
