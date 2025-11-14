"use server";

import { auth } from "@/shared/infrastructure/libs/auth";
import { prisma } from "@/shared/infrastructure/libs/prisma";
import { sendEventInvitation } from "@/shared/infrastructure/resend/infrastructure/utils/sendEventInvitation";

/**
 * Reenvía una invitación a un correo específico
 */
export async function resendInvitationAction(invitationId: string) {
  try {
    const session = await auth();

    if (!session) {
      return {
        success: false,
        message: "No autorizado. Debes iniciar sesión.",
      };
    }

    // Buscar la invitación
    const invitation = await prisma.invitationsForEvent.findUnique({
      where: { id: invitationId },
      include: {
        event: true,
      },
    });

    if (!invitation) {
      return {
        success: false,
        message: "Invitación no encontrada.",
      };
    }

    // Verificar que el usuario sea el dueño del evento
    if (invitation.event.userId !== session.user.id) {
      return {
        success: false,
        message: "No tienes permisos para reenviar esta invitación.",
      };
    }

    // Reenviar el correo
    const result = await sendEventInvitation({
      to: invitation.email,
      eventTitle: invitation.event.title,
      eventDescription: invitation.event.description || undefined,
      startDate: invitation.event.startDate,
      endDate: invitation.event.endDate,
      invitationCode: invitation.code,
    });

    if (!result.success) {
      return {
        success: false,
        message: `Error al enviar el correo: ${result.error}`,
      };
    }

    return {
      success: true,
      message: `Invitación reenviada exitosamente a ${invitation.email}`,
    };
  } catch (error) {
    console.error("Error en resendInvitationAction:", error);
    return {
      success: false,
      message: "Ocurrió un error inesperado al reenviar la invitación.",
    };
  }
}

/**
 * Reenvía todas las invitaciones de un evento
 */
export async function resendAllInvitationsAction(eventId: string) {
  try {
    const session = await auth();

    if (!session) {
      return {
        success: false,
        message: "No autorizado. Debes iniciar sesión.",
      };
    }

    // Buscar el evento
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        invitations: true,
      },
    });

    if (!event) {
      return {
        success: false,
        message: "Evento no encontrado.",
      };
    }

    // Verificar que el usuario sea el dueño del evento
    if (event.userId !== session.user.id) {
      return {
        success: false,
        message: "No tienes permisos para gestionar este evento.",
      };
    }

    if (event.invitations.length === 0) {
      return {
        success: false,
        message: "Este evento no tiene invitaciones.",
      };
    }

    // Reenviar todas las invitaciones
    let successCount = 0;
    let failCount = 0;

    for (const invitation of event.invitations) {
      const result = await sendEventInvitation({
        to: invitation.email,
        eventTitle: event.title,
        eventDescription: event.description || undefined,
        startDate: event.startDate,
        endDate: event.endDate,
        invitationCode: invitation.code,
      });

      if (result.success) {
        successCount++;
      } else {
        failCount++;
        console.error(`Error reenviando a ${invitation.email}:`, result.error);
      }

      // Delay entre envíos
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    return {
      success: true,
      message: `Reenvío completado. Exitosos: ${successCount}, Fallidos: ${failCount}`,
      stats: { success: successCount, failed: failCount },
    };
  } catch (error) {
    console.error("Error en resendAllInvitationsAction:", error);
    return {
      success: false,
      message: "Ocurrió un error inesperado al reenviar las invitaciones.",
    };
  }
}
