import { SIGN_IN_ROUTE } from "@/shared/infrastructure/utils/routes";
import UserRegisterForm from "../components/UserRegisterForm";

const SignUpPage = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col justify-center space-y-6 w-full max-w-sm px-4">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Crear una cuenta
          </h1>
          <p className="text-sm text-gray-500">
            ¿Ya tienes una cuenta?{" "}
            <a href={SIGN_IN_ROUTE} className="text-blue-500 hover:underline">
              Inicia sesión aquí
            </a>
          </p>
        </div>
        <UserRegisterForm />
      </div>
    </div>
  );
};

export default SignUpPage;
