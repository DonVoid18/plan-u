import { z } from "zod";

export const CreateEventPayloadSchema = z
  .object({
    title: z.string().nonempty("El título es obligatorio"),
    description: z.string().optional(),
    startDate: z.date(),
    endDate: z.date(),
    linkZoom: z.string().url("La URL de Zoom no es válida").optional(),
    linkGoogleMeet: z
      .string()
      .url("La URL de Google Meet no es válida")
      .optional(),
    linkGoogleMaps: z
      .string()
      .url("La URL de Google Maps no es válida")
      .optional(),
    private: z.boolean().default(false).optional(),
    requireApproval: z.boolean().default(false).optional(),
    limitParticipants: z.number().min(1).max(10000).nullable().nonoptional(),
    emailsFile: z.instanceof(File).optional().nullable(),
    imageFile: z.instanceof(File).optional().nullable(),
    theme: z.string().optional().nullable(),
    sound: z.string().optional().nullable(),
    video: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return data.startDate >= now;
    },
    {
      message: "La fecha de inicio debe ser hoy o en el futuro",
      path: ["startDate"],
    }
  )
  .refine((data) => data.endDate > data.startDate, {
    message: "La fecha de fin debe ser después de la fecha de inicio",
    path: ["endDate"],
  });

// Tipado de TypeScript inferido desde el esquema
export type CreateEventPayload = z.infer<typeof CreateEventPayloadSchema>;
