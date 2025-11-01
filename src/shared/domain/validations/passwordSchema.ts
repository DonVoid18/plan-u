import z from "zod";

export const PasswordSchema = z
  .string()
  .min(4, "La contraseña debe tener al menos 4 caracteres")
  .regex(
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{4,}$/,
    "La contraseña debe contener al menos 4 caracteres, una letra mayúscula, una letra minúscula y un número"
  );
