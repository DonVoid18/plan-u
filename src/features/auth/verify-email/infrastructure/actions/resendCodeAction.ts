"use server";

import {
  fromEmail,
  resend,
} from "@/shared/infrastructure/resend/infrastructure/utils/resend";
import {
  TIME_EXPIRATION_MINUTES,
  generateCodeOTP,
} from "@/shared/infrastructure/utils/generateCodeOTP";

import { auth } from "@/shared/infrastructure/libs/auth";
import { prisma } from "@/shared/infrastructure/libs/prisma";
import { EmailVerificationTemplate } from "@/shared/infrastructure/resend/infrastructure/components/EmailVerificationTemplate";
import { SIGN_IN_ROUTE } from "@/shared/infrastructure/utils/routes";
import { redirect } from "next/navigation";

export const resendCodeAction = async () => {
  const session = await auth();

  if (!session) {
    redirect(SIGN_IN_ROUTE);
  }

  try {
    const existingToken = await prisma.verificationToken.findFirst({
      where: { identifier: session.user.email },
      orderBy: { expires: "desc" },
    });

    console.log({ existingToken });

    console.log("fecha a comparar", new Date());

    if (existingToken && existingToken.expires > new Date()) {
      return {
        success: false,
        message: "El código aún es válido. Por favor, revisa tu correo.",
      };
    }

    const token = generateCodeOTP();

    await prisma.verificationToken.create({
      data: {
        identifier: session.user.email,
        token,
        expires: TIME_EXPIRATION_MINUTES,
      },
    });

    await resend.emails.send({
      from: fromEmail,
      to: [session.user.email],
      subject: "Reenvío de código de verificación",
      react: EmailVerificationTemplate({
        userName: session.user.name,
        verificationCode: token,
      }),
    });

    return { success: true, message: "Código reenviado correctamente." };
  } catch (error) {
    console.error("Error resending code:", error);
    return { success: false, message: "Error al reenviar el código." };
  }
};
