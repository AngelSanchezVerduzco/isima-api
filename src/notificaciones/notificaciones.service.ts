/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { db } from '../database/config'; // Asegúrate de que la ruta a tu conexión de DB sea correcta
import { notificaciones } from '../database/schema/notificaciones'; // Importa el esquema de notificaciones
import { CreateNotificationDto } from './dto/create-notification.dto'; // Crearemos este DTO
import { eq, and, lte } from 'drizzle-orm'; // Importa lte desde drizzle-orm

@Injectable()
export class NotificacionesService {
  async createNotification(createNotificationDto: CreateNotificationDto) {
    try {
      const [notification] = await db
        .insert(notificaciones)
        .values(createNotificationDto)
        .returning();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      // No lanzamos una excepción BadRequest aquí porque la creación de notificación
      // podría ser un efecto secundario y no queremos que falle la operación principal (ej. crear calendario)
      // Podrías loggear el error o manejarlo de otra forma.
      return null; // Indica que la creación falló
    }
  }

  // Método para obtener notificaciones de un usuario (para el frontend)
  async findUserNotifications(userId: number) {
    // Aquí necesitarías un JOIN o una consulta más compleja si las notificaciones son por grupo
    // Por ahora, asumimos que destinatarioUsuarioId está poblado
    return await db
      .select()
      .from(notificaciones)
      .where(eq(notificaciones.destinatarioUsuarioId, userId));
  }

  // Método para marcar una notificación como leída (si añades un campo 'leida' al esquema)
  // async markAsRead(notificationId: number) {
  //   await db.update(notificaciones).set({ leida: true }).where(eq(notificaciones.id, notificationId));
  // }

  // Método para obtener notificaciones pendientes (para el proceso de envío en segundo plano)
  async findPendingNotificationsToSend() {
    // Busca notificaciones pendientes cuya fechaHoraNotificacion sea <= ahora
    const now = new Date();
    return await db
      .select()
      .from(notificaciones)
      .where(
        and(
          eq(notificaciones.estado, 'pendiente'),
          lte(notificaciones.fechaEnvio, new Date(now.getTime())) // Compare timestamps
        )
      );
  }

  // Método para actualizar el estado de una notificación después de intentar enviarla
  async updateNotificationStatus(notificationId: number, status: 'enviada' | 'fallida') {
    await db
      .update(notificaciones)
      .set({ estado: status, fechaEnvio: new Date() })
      .where(eq(notificaciones.id, notificationId));
  }

  // Aquí iría la lógica para enviar los diferentes tipos de notificaciones (Gmail, Push, In-app)
  // Esto es más complejo y requeriría integración con librerías o servicios externos.
  async sendNotification(notification: typeof notificaciones.$inferSelect) {
    console.log(
      `Attempting to send ${notification.tipo} notification: "${notification.titulo}" to user ${notification.destinatarioUsuarioId || notification.destinatarioGrupoId}`
    );
    // Implementar lógica de envío real aquí
    // if (notification.tipo === 'gmail') { ... }
    // if (notification.tipo === 'push') { ... }
    // if (notification.tipo === 'in-app') { ... } // Esto solo implica que el frontend la mostrará al abrir la app

    // Simulación de envío exitoso
    await this.updateNotificationStatus(notification.id, 'enviada');
    console.log(`Notification ${notification.id} marked as sent.`);
  }
}
// Eliminar la definición local de lte que causa el conflicto
// function lte(fechaHoraNotificacion: any, arg1: Date): import('drizzle-orm').SQLWrapper | undefined {
//   throw new Error('Function not implemented.');
// }
