"use server";

import { signIn } from "@/shared/infrastructure/libs/auth";
import { EMAIL_VERIFICATION_ROUTE } from "@/shared/infrastructure/utils/routes";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { SignIn } from "../../domain/validations/signIn";

export const signInAction = async (credentials: SignIn) => {
  try {
    const { email, password } = credentials;

    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            message: "Correo electrónico o contraseña incorrecta",
          };
        default:
          return {
            success: false,
            message: "Error interno, inténtelo más tarde",
          };
      }
    }
  }
  redirect(EMAIL_VERIFICATION_ROUTE);
};
