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
    let invitedParticipants: Array<{
      dni: string;
      names: string;
      program: string;
      mention: string;
      email: string;
    }> = [];
    let duplicatesCount = 0;

    if (emailsFile && emailsFile.size > 0) {
      try {
        // Leer el archivo
        const arrayBuffer = await emailsFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Procesar con xlsx
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convertir a JSON con encabezados
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<
          string,
          any
        >[];

        // Función para encontrar columna case-insensitive y sin espacios extras
        const findColumn = (
          row: Record<string, any>,
          columnName: string
        ): string | undefined => {
          const key = Object.keys(row).find(
            (k) => k.toLowerCase().trim() === columnName.toLowerCase().trim()
          );
          return key && row[key] ? String(row[key]).trim() : undefined;
        };

        // Validar que existan las columnas obligatorias
        if (jsonData.length > 0) {
          const firstRow = jsonData[0];
          const columns = Object.keys(firstRow).map((col) =>
            col.toLowerCase().trim()
          );
          const requiredColumns = [
            "dni",
            "nombre y apellidos",
            "programa",
            "mencion",
            "correo",
          ];

          const missingColumns = requiredColumns.filter(
            (col) => !columns.includes(col)
          );

          if (missingColumns.length > 0) {
            return {
              success: false,
              message: `El archivo Excel debe contener exactamente estas columnas (en minúsculas o mayúsculas): dni, nombre y apellidos, programa, mencion, correo. Faltan: ${missingColumns.join(", ")}`,
            };
          }
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const validateEmail = (email: string): boolean => {
          return emailRegex.test(email.trim());
        };

        // Extraer datos de las filas
        const extractedParticipants: typeof invitedParticipants = [];
        const errors: string[] = [];

        jsonData.forEach((row, index) => {
          const rowNumber = index + 2; // +2 porque index empieza en 0 y la primera fila es el encabezado

          const dni = findColumn(row, "dni");
          const nombreYApellidos = findColumn(row, "nombre y apellidos");
          const programa = findColumn(row, "programa");
          const mencion = findColumn(row, "mencion");
          const correo = findColumn(row, "correo");

          // Validar campos obligatorios
          if (!dni) {
            errors.push(`Fila ${rowNumber}: Falta el campo dni`);
            return;
          }
          if (!nombreYApellidos) {
            errors.push(`Fila ${rowNumber}: Falta el campo nombre y apellidos`);
            return;
          }
          if (!programa) {
            errors.push(`Fila ${rowNumber}: Falta el campo programa`);
            return;
          }
          if (!mencion) {
            errors.push(`Fila ${rowNumber}: Falta el campo mencion`);
            return;
          }
          if (!correo) {
            errors.push(`Fila ${rowNumber}: Falta el campo correo`);
            return;
          }

          // Validar formato de email
          if (!validateEmail(correo)) {
            errors.push(`Fila ${rowNumber}: Email inválido (${correo})`);
            return;
          }

          extractedParticipants.push({
            dni,
            names: nombreYApellidos,
            program: programa,
            mention: mencion,
            email: correo.toLowerCase(),
          });
        });

        // Si hay errores, retornar con el detalle
        if (errors.length > 0) {
          return {
            success: false,
            message: `Error en el archivo Excel:\n${errors.slice(0, 5).join("\n")}${errors.length > 5 ? `\n... y ${errors.length - 5} errores más` : ""}`,
          };
        }

        // Eliminar duplicados de DNI (mantener solo el primero)
        const dniSet = new Set<string>();
        const uniqueParticipants: typeof invitedParticipants = [];

        extractedParticipants.forEach((p) => {
          if (!dniSet.has(p.dni)) {
            dniSet.add(p.dni);
            uniqueParticipants.push(p);
          }
        });

        const duplicatesCountTemp =
          extractedParticipants.length - uniqueParticipants.length;

        invitedParticipants = uniqueParticipants;

        // Actualizar el conteo de duplicados
        duplicatesCount = duplicatesCountTemp;
      } catch (error) {
        console.error("Error al procesar archivo Excel:", error);
        return {
          success: false,
          message:
            "Error al procesar el archivo Excel. Verifica que sea un archivo válido con las columnas exactas: dni, nombre y apellidos, programa, mencion, correo.",
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
    const invitationsData = invitedParticipants.map((participant) => ({
      dni: participant.dni,
      names: participant.names,
      program: participant.program,
      mention: participant.mention,
      email: participant.email,
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
      invitedParticipants.length > 0
        ? `Evento creado exitosamente. Se procesaron ${invitedParticipants.length} participante${invitedParticipants.length !== 1 ? "s" : ""}.${duplicatesCount > 0 ? ` Se omitieron ${duplicatesCount} DNI${duplicatesCount !== 1 ? "s" : ""} duplicado${duplicatesCount !== 1 ? "s" : ""}.` : ""} Las invitaciones con código QR se están enviando.`
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
