"use server";

import {
  fromEmail,
  resend,
} from "@/shared/infrastructure/resend/infrastructure/utils/resend";

import { prisma } from "@/shared/infrastructure/libs/prisma";
import { EventInvitationTemplate } from "@/shared/infrastructure/resend/infrastructure/components/EventInvitationTemplate";
import { generateQRCodeBuffer } from "@/shared/infrastructure/utils/generateQRCode";

interface SendMassEmailParams {
  eventId: string;
}

interface EmailResult {
  email: string;
  success: boolean;
  error?: string;
}

export const sendMassEmailAction = async ({ eventId }: SendMassEmailParams) => {
  try {
    // Obtener el evento con sus invitaciones
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        invitations: true,
      },
    });

    if (!event) {
      return {
        success: false,
        message: "Evento no encontrado",
      };
    }

    if (event.invitations.length === 0) {
      return {
        success: false,
        message: "No hay invitados para este evento",
      };
    }

    const results: EmailResult[] = [];
    const batchSize = 10; // Enviar emails en lotes de 10 para evitar límites de tasa

    // Formatear fechas
    const startDate = new Intl.DateTimeFormat("es-ES", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(event.startDate);

    const endDate = new Intl.DateTimeFormat("es-ES", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(event.endDate);

    // Procesar invitaciones en lotes
    for (let i = 0; i < event.invitations.length; i += batchSize) {
      const batch = event.invitations.slice(i, i + batchSize);

      const batchPromises = batch.map(async (invitation) => {
        try {
          // Generar código QR como buffer para adjuntar
          const qrCodeBuffer = await generateQRCodeBuffer(invitation.code);

          // URL del evento (ajusta según tu estructura de rutas)
          const eventLink = `${process.env.NEXTAUTH_URL}/event/${event.id}`;

          // Enviar correo con el QR como adjunto
          await resend.emails.send({
            from: fromEmail,
            to: [invitation.email],
            subject: `Invitación a ${event.title}`,
            react: EventInvitationTemplate({
              eventTitle: event.title,
              eventDescription: event.description || undefined,
              startDate,
              endDate,
              qrCodeDataUrl: "cid:qr-code", // Usar CID para referenciar el adjunto
              eventLink,
            }),
            attachments: [
              {
                filename: "qr-code.png",
                content: qrCodeBuffer,
                contentId: "qr-code", // ID para referenciar en el HTML
              },
            ],
          });

          return {
            email: invitation.email,
            success: true,
          };
        } catch (error) {
          console.error(`Error enviando email a ${invitation.email}:`, error);
          return {
            email: invitation.email,
            success: false,
            error: error instanceof Error ? error.message : "Error desconocido",
          };
        }
      });

      // Esperar a que se complete el lote actual
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Pequeña pausa entre lotes para evitar límites de tasa (100ms)
      if (i + batchSize < event.invitations.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Contar éxitos y fallos
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return {
      success: true,
      message: `Envío completado: ${successCount} exitosos, ${failCount} fallidos`,
      details: {
        total: results.length,
        successful: successCount,
        failed: failCount,
        results,
      },
    };
  } catch (error) {
    console.error("Error en sendMassEmailAction:", error);
    return {
      success: false,
      message: "Error al enviar correos masivos",
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
};
