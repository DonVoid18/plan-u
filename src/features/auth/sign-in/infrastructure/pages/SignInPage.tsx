import { SIGN_UP_ROUTE } from "@/shared/infrastructure/utils/routes";
import UserAuthForm from "../components/UserAuthForm";

const SignInPage = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col justify-center space-y-6 w-full max-w-sm px-4">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Iniciar sesión
          </h1>
          <p className="text-sm text-gray-500">
            ¿No tienes una cuenta?{" "}
            <a href={SIGN_UP_ROUTE} className="text-blue-500 hover:underline">
              Regístrate aquí
            </a>
          </p>
        </div>
        <UserAuthForm />
      </div>
    </div>
  );
};

export default SignInPage;
