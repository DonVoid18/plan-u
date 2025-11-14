"use server";

import {
  fromEmail,
  resend,
} from "@/shared/infrastructure/resend/infrastructure/utils/resend";

import { EventInvitationTemplate } from "@/shared/infrastructure/resend/infrastructure/components/EventInvitationTemplate";
import { generateQRCode } from "@/shared/infrastructure/utils/generateQRCode";
import { render } from "@react-email/render";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SendEventInvitationParams {
  to: string;
  eventTitle: string;
  eventDescription?: string;
  startDate: Date;
  endDate: Date;
  invitationCode: string;
}

/**
 * Envía un correo de invitación con código QR para un evento
 */
export async function sendEventInvitation({
  to,
  eventTitle,
  eventDescription,
  startDate,
  endDate,
  invitationCode,
}: SendEventInvitationParams) {
  try {
    // Generar el enlace que se codificará en el QR
    // Puedes cambiar esto por la URL de tu aplicación
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const eventLink = `${baseUrl}/event/check-in/${invitationCode}`;

    // Generar el código QR
    const qrCodeDataUrl = await generateQRCode(eventLink);

    // Formatear las fechas
    const formattedStartDate = format(startDate, "PPP 'a las' p", {
      locale: es,
    });
    const formattedEndDate = format(endDate, "PPP 'a las' p", { locale: es });

    // Renderizar el template
    const emailHtml = await render(
      EventInvitationTemplate({
        eventTitle,
        eventDescription,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        qrCodeDataUrl,
        eventLink,
      })
    );

    // Enviar el correo
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject: `Invitación: ${eventTitle}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Error enviando invitación:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en sendEventInvitation:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al enviar invitación",
    };
  }
}

/**
 * Envía invitaciones en lote con un delay entre cada envío
 */
export async function sendEventInvitationsBatch(
  invitations: SendEventInvitationParams[],
  delayMs: number = 300
) {
  const results = {
    success: [] as string[],
    failed: [] as { email: string; error: string }[],
  };

  for (const invitation of invitations) {
    const result = await sendEventInvitation(invitation);

    if (result.success) {
      results.success.push(invitation.to);
    } else {
      results.failed.push({
        email: invitation.to,
        error: result.error || "Error desconocido",
      });
    }

    // Delay entre envíos para evitar rate limiting
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
