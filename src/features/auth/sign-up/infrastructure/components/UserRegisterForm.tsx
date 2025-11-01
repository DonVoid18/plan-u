"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/infrastructure/shadcn/components/ui/form";
import {
  MAIN_ROUTE,
  SIGN_IN_ROUTE,
} from "@/shared/infrastructure/utils/routes";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { SignUp, SignUpSchema } from "../../domain/validations/signUp";

import { Button } from "@/shared/infrastructure/shadcn/components/ui/button";
import { Input } from "@/shared/infrastructure/shadcn/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { signUpAction } from "../actions/signUpAction";

export default function UserRegisterForm() {
  const [loading, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const defaultValues = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  };

  const form = useForm<SignUp>({
    resolver: zodResolver(SignUpSchema),
    defaultValues,
  });

  const onSubmit = async (data: SignUp) => {
    setErrorMessage(null);
    startTransition(async () => {
      const response = await signUpAction(data);

      if (!response.success) {
        setErrorMessage(response.message);
        return;
      }

      if (response.success) {
        toast.success(response.message);
        router.push(SIGN_IN_ROUTE);
        return;
      }
    });
  };

  useEffect(() => {
    if (error === "OAuthAccountNotLinked") {
      setErrorMessage(
        "Este correo ya está registrado. Inicia sesión con tu correo y contraseña."
      );
    } else if (error) {
      setErrorMessage("Hubo un problema al iniciar sesión.");
    }
  }, [error]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de usuario</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Ingresar nombre de usuario"
                  disabled={loading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Ingresar correo electrónico"
                  disabled={loading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresar contraseña"
                    disabled={loading}
                    {...field}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Contraseña</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirmar contraseña"
                    disabled={loading}
                    {...field}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
        <Button disabled={loading} className="ml-auto w-full" type="submit">
          Registrarme
        </Button>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant="outline"
            type="button"
            className="w-full"
            onClick={() =>
              signIn("github", {
                redirect: true,
                redirectTo: MAIN_ROUTE,
              })
            }
          >
            GitHub
          </Button>
          <Button
            variant="outline"
            type="button"
            className="w-full"
            onClick={() =>
              signIn("google", {
                redirect: true,
                redirectTo: MAIN_ROUTE,
              })
            }
          >
            Google
          </Button>
        </div>
      </form>
    </Form>
  );
}
