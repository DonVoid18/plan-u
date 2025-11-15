"use server";

import { auth } from "@/shared/infrastructure/libs/auth";
import { prisma } from "@/shared/infrastructure/libs/prisma";

export const checkInAction = async (code: string) => {
  try {
    const session = await auth();

    if (!session) {
      return {
        success: false,
        message: "No se encontró la sesión del usuario",
        data: null,
      };
    }

    // Buscar la invitación por código
    const invitation = await prisma.invitationsForEvent.findUnique({
      where: {
        code: code,
      },
      include: {
        event: true,
      },
    });

    if (!invitation) {
      return {
        success: false,
        message: "Código de invitación no válido",
        data: null,
      };
    }

    // Verificar si el evento pertenece al usuario actual
    if (invitation.event.userId !== session.user?.id) {
      return {
        success: false,
        message: "No tienes permisos para realizar check-in en este evento",
        data: null,
      };
    }

    // Si ya fue escaneado, retornar la información del check-in previo
    if (invitation.scanned) {
      const registeredGuests = invitation.guest || 0;
      const canAddMore = registeredGuests < 2;

      let statusMessage = "";
      if (registeredGuests === 0) {
        statusMessage = "Ningún invitado registrado aún.";
      } else if (registeredGuests === 1) {
        statusMessage =
          "Invitado 1 ya registrado. Puedes registrar al invitado 2.";
      } else {
        statusMessage = "Ambos invitados ya registrados.";
      }

      return {
        success: true,
        message: `Check-in para ${invitation.email}. ${statusMessage}`,
        data: {
          id: invitation.id,
          dni: invitation.dni,
          names: invitation.names,
          program: invitation.program,
          mention: invitation.mention,
          email: invitation.email,
          guest: invitation.guest,
          eventTitle: invitation.event.title,
          alreadyScanned: true,
          canAddMore: canAddMore,
        },
      };
    }

    // Retornar la información de la invitación para que el personal pueda marcar los invitados
    return {
      success: true,
      message: `Invitación válida para ${invitation.email}`,
      data: {
        id: invitation.id,
        dni: invitation.dni,
        names: invitation.names,
        program: invitation.program,
        mention: invitation.mention,
        email: invitation.email,
        guest: invitation.guest,
        eventTitle: invitation.event.title,
        alreadyScanned: false,
      },
    };
  } catch (error) {
    console.error("Error en checkInAction:", error);
    return {
      success: false,
      message:
        "Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.",
      data: null,
    };
  }
};

export const checkInByDniAction = async (dni: string) => {
  try {
    const session = await auth();

    if (!session) {
      return {
        success: false,
        message: "No se encontró la sesión del usuario",
        data: null,
      };
    }

    // Buscar la invitación por DNI
    const invitation = await prisma.invitationsForEvent.findUnique({
      where: {
        dni: dni,
      },
      include: {
        event: true,
      },
    });

    if (!invitation) {
      return {
        success: false,
        message: "DNI no encontrado en las invitaciones",
        data: null,
      };
    }

    // Verificar si el evento pertenece al usuario actual
    if (invitation.event.userId !== session.user?.id) {
      return {
        success: false,
        message: "No tienes permisos para realizar check-in en este evento",
        data: null,
      };
    }

    // Si ya fue escaneado, retornar la información del check-in previo
    if (invitation.scanned) {
      const registeredGuests = invitation.guest || 0;
      const canAddMore = registeredGuests < 2;

      let statusMessage = "";
      if (registeredGuests === 0) {
        statusMessage = "Ningún invitado registrado aún.";
      } else if (registeredGuests === 1) {
        statusMessage =
          "Invitado 1 ya registrado. Puedes registrar al invitado 2.";
      } else {
        statusMessage = "Ambos invitados ya registrados.";
      }

      return {
        success: true,
        message: `Check-in para ${invitation.email}. ${statusMessage}`,
        data: {
          id: invitation.id,
          dni: invitation.dni,
          names: invitation.names,
          program: invitation.program,
          mention: invitation.mention,
          email: invitation.email,
          guest: invitation.guest,
          eventTitle: invitation.event.title,
          alreadyScanned: true,
          canAddMore: canAddMore,
        },
      };
    }

    // Retornar la información de la invitación para que el personal pueda marcar los invitados
    return {
      success: true,
      message: `Invitación válida para ${invitation.email}`,
      data: {
        id: invitation.id,
        dni: invitation.dni,
        names: invitation.names,
        program: invitation.program,
        mention: invitation.mention,
        email: invitation.email,
        guest: invitation.guest,
        eventTitle: invitation.event.title,
        alreadyScanned: false,
      },
    };
  } catch (error) {
    console.error("Error en checkInByDniAction:", error);
    return {
      success: false,
      message:
        "Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.",
      data: null,
    };
  }
};

export const confirmCheckInAction = async (
  invitationId: string,
  guestCount: number
) => {
  try {
    const session = await auth();

    if (!session) {
      return {
        success: false,
        message: "No se encontró la sesión del usuario",
      };
    }

    // Validar que guestCount esté entre 0 y 2
    if (guestCount < 0 || guestCount > 2) {
      return {
        success: false,
        message: "Número de invitados no válido",
      };
    }

    // Buscar la invitación
    const invitation = await prisma.invitationsForEvent.findUnique({
      where: {
        id: invitationId,
      },
      include: {
        event: true,
      },
    });

    if (!invitation) {
      return {
        success: false,
        message: "Invitación no encontrada",
      };
    }

    // Verificar permisos
    if (invitation.event.userId !== session.user?.id) {
      return {
        success: false,
        message: "No tienes permisos para realizar esta acción",
      };
    }

    // Si ya estaba escaneado, validar que solo se pueda incrementar el número de invitados
    const currentGuests = invitation.guest || 0;
    if (invitation.scanned && guestCount <= currentGuests) {
      return {
        success: false,
        message: `Ya tienes ${currentGuests} invitado(s) registrado(s). Solo puedes incrementar, no reducir.`,
      };
    }

    // Actualizar la invitación con scanned = true y guest = guestCount
    const wasAlreadyScanned = invitation.scanned;
    await prisma.invitationsForEvent.update({
      where: {
        id: invitationId,
      },
      data: {
        scanned: true,
        guest: guestCount,
      },
    });

    let message: string;

    if (!wasAlreadyScanned) {
      // Primer registro
      if (guestCount === 0) {
        message = `Check-in confirmado para ${invitation.email}. Ningún invitado registrado aún.`;
      } else if (guestCount === 1) {
        message = `Check-in confirmado. Invitado 1 registrado.`;
      } else {
        message = `Check-in confirmado. Ambos invitados registrados.`;
      }
    } else {
      // Actualización
      if (guestCount === 1) {
        message = `Check-in actualizado. Invitado 1 ahora registrado.`;
      } else {
        message = `Check-in actualizado. Invitado 2 ahora registrado. Ambos invitados completos.`;
      }
    }

    return {
      success: true,
      message: message,
    };
  } catch (error) {
    console.error("Error en confirmCheckInAction:", error);
    return {
      success: false,
      message:
        "Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.",
    };
  }
};
