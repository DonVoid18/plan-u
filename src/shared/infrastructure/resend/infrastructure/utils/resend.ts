import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);

export const fromEmail =
  process.env.NODE_ENV === "production"
    ? process.env.EMAIL_FROM!
    : "Acme <onboarding@resend.dev>";
