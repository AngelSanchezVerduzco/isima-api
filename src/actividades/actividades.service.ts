/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { db } from '../database/config'; // Asegúrate de que la ruta a tu conexión de DB sea correcta
import { actividades } from '../database/schema/actividades'; // Importa el esquema de actividades
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';
import { eq } from 'drizzle-orm';

@Injectable()
export class ActividadesService {
  async create(createActividadDto: CreateActividadDto) {
    try {
      const [actividad] = await db.insert(actividades).values(createActividadDto).returning();
      return {
        mensaje: 'Actividad creada exitosamente',
        datos: actividad,
      };
    } catch (error) {
      throw new BadRequestException('Error al crear la actividad');
    }
  }

  async findAll() {
    return await db.select().from(actividades);
  }

  async findOne(id: number) {
    const [actividad] = await db.select().from(actividades).where(eq(actividades.id, id));
    if (!actividad) {
      throw new NotFoundException('Actividad no encontrada');
    }
    return actividad;
  }

  async update(id: number, updateActividadDto: UpdateActividadDto) {
    const [actividad] = await db
      .update(actividades)
      .set(updateActividadDto)
      .where(eq(actividades.id, id))
      .returning();
    if (!actividad) {
      throw new NotFoundException('Actividad no encontrada');
    }
    return {
      mensaje: 'Actividad actualizada exitosamente',
      datos: actividad,
    };
  }

  async remove(id: number) {
    const [actividad] = await db.delete(actividades).where(eq(actividades.id, id)).returning();
    if (!actividad) {
      throw new NotFoundException('Actividad no encontrada');
    }
    return {
      mensaje: 'Actividad eliminada exitosamente',
      datos: actividad,
    };
  }

  // Podrías añadir un método para obtener actividades predefinidas si las marcas de alguna manera
  // async findPredefinidas() {
  //   return await db.select().from(actividades).where(eq(actividades.tipo, 'predefinida'));
  // }
}
