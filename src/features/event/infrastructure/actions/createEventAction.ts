"use server";

import * as XLSX from "xlsx";

import { auth } from "@/shared/infrastructure/libs/auth";
import { prisma } from "@/shared/infrastructure/libs/prisma";
import { saveImage } from "@/shared/infrastructure/utils/saveImage";

export const createEventAction = async (formData: FormData) => {
  try {
    const session = await auth();

    if (!session) {
      throw new Error("No se encontró la sesión del usuario");
    }

    // Extraer datos del FormData
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const startDate = new Date(formData.get("startDate") as string);
    const endDate = new Date(formData.get("endDate") as string);
    const linkZoom = formData.get("linkZoom") as string | null;
    const linkGoogleMeet = formData.get("linkGoogleMeet") as string | null;
    const linkGoogleMaps = formData.get("linkGoogleMaps") as string | null;
    const privateEvent = formData.get("private") === "true";
    const requireApproval = formData.get("requireApproval") === "true";
    const limitParticipantsStr = formData.get("limitParticipants") as string;
    const limitParticipants =
      limitParticipantsStr && limitParticipantsStr !== "null"
        ? parseInt(limitParticipantsStr)
        : null;
    const theme = formData.get("theme") as string | null;
    const sound = formData.get("sound") as string | null;
    const video = formData.get("video") as string | null;

    // Procesar archivo de imagen si existe
    const imageFile = formData.get("imageFile") as File | null;
    let imagePath: string | null = null;

    if (imageFile && imageFile.size > 0) {
      try {
        imagePath = await saveImage(imageFile);
      } catch (error) {
        console.error("Error al guardar la imagen:", error);
        return {
          success: false,
          message: "Error al guardar la imagen. Por favor, intenta de nuevo.",
        };
      }
    }

    // Procesar archivo Excel si existe
    const emailsFile = formData.get("emailsFile") as File | null;
    let invitedEmails: string[] = [];

    if (emailsFile && emailsFile.size > 0) {
      try {
        // Leer el archivo
        const arrayBuffer = await emailsFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Procesar con xlsx
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        }) as string[][];

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const validateEmail = (email: string): boolean => {
          return emailRegex.test(email.trim());
        };

        // Extraer correos de la primera columna
        const extractedEmails: string[] = [];

        jsonData.forEach((row, index) => {
          if (row.length > 0 && row[0]) {
            const email = String(row[0]).trim();

            // Saltar encabezados comunes
            if (
              index === 0 &&
              (email.toLowerCase() === "email" ||
                email.toLowerCase() === "correo" ||
                email.toLowerCase() === "e-mail" ||
                email.toLowerCase() === "correos")
            ) {
              return;
            }

            if (email && validateEmail(email)) {
              extractedEmails.push(email.toLowerCase());
            }
          }
        });

        // Eliminar duplicados
        invitedEmails = Array.from(new Set(extractedEmails));
      } catch (error) {
        console.error("Error al procesar archivo Excel:", error);
        return {
          success: false,
          message:
            "Error al procesar el archivo Excel. Verifica que sea un archivo válido.",
        };
      }
    }

    // Crear el evento
    const eventCreated = await prisma.event.create({
      data: {
        title,
        description,
        startDate,
        endDate,
        linkZoom,
        linkGoogleMeet,
        linkGoogleMaps,
        private: privateEvent,
        requireApproval,
        limitParticipants,
        theme,
        sound,
        video,
        image: imagePath,
        userId: session.user.id,
      },
    });

    // Crear invitaciones en la base de datos
    const invitationsData = invitedEmails.map((email) => ({
      email,
      eventId: eventCreated.id,
      userId: session.user.id,
      code: crypto.randomUUID(),
    }));

    if (invitationsData.length > 0) {
      await prisma.invitationsForEvent.createMany({
        data: invitationsData,
      });
    }

    const message =
      invitedEmails.length > 0
        ? `Evento creado exitosamente. Se procesaron ${invitedEmails.length} correo${invitedEmails.length !== 1 ? "s" : ""}. Las invitaciones con código QR se están enviando.`
        : "Evento creado exitosamente";

    return {
      success: true,
      message,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return {
      success: false,
      message:
        "Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.",
    };
  }
};
