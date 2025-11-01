import SignUpPage from "@/features/auth/sign-up/infrastructure/pages/SignUpPage";
import { auth } from "@/shared/infrastructure/libs/auth";
import { MAIN_ROUTE } from "@/shared/infrastructure/utils/routes";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Authentication | Sign Up",
  description: "Sign Up page for authentication.",
};

export default async function Page() {
  const session = await auth();

  if (session) {
    redirect(MAIN_ROUTE);
  }

  return <SignUpPage />;
}
