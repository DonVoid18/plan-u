"use server";

import {
  fromEmail,
  resend,
} from "@/shared/infrastructure/resend/infrastructure/utils/resend";
import {
  TIME_EXPIRATION_MINUTES,
  generateCodeOTP,
} from "@/shared/infrastructure/utils/generateCodeOTP";

import { passwordEncrypt } from "@/shared/infrastructure/libs/password";
import { prisma } from "@/shared/infrastructure/libs/prisma";
import { EmailVerificationTemplate } from "@/shared/infrastructure/resend/infrastructure/components/EmailVerificationTemplate";
import { SignUp } from "../../domain/validations/signUp";

export const signUpAction = async (user: SignUp) => {
  try {
    const { email, password, name } = user;

    const existingUserName = await prisma.user.findFirst({
      where: { name },
    });

    if (existingUserName) {
      return {
        success: false,
        message: "El nombre de usuario ya está registrado",
      };
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return {
        success: false,
        message: "El correo electrónico ya está registrado",
      };
    }

    const passwordEncrypted = await passwordEncrypt(password);

    await prisma.user.create({
      data: {
        email,
        password: passwordEncrypted,
        name,
      },
    });

    const token = generateCodeOTP();

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: TIME_EXPIRATION_MINUTES,
      },
    });

    // Optional: Send verification email
    await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: "Código de verificación",
      react: EmailVerificationTemplate({
        userName: name,
        verificationCode: token,
      }),
    });

    return {
      success: true,
      message:
        "Se ha enviado un código de verificación a tu correo electrónico",
    };
  } catch (error) {
    console.error("Error registering user:", error);
    return {
      success: false,
      message: "Error al registrar el usuario",
    };
  }
};
