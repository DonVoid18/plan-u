import CheckInPage from "@/features/check-in/infrastructure/pages/CheckInPage";
import { auth } from "@/shared/infrastructure/libs/auth";
import { SIGN_IN_ROUTE } from "@/shared/infrastructure/utils/routes";
import { redirect } from "next/navigation";

const page = async () => {
  const session = await auth();

  if (!session) {
    redirect(SIGN_IN_ROUTE);
  }

  return <CheckInPage />;
};

export default page;
