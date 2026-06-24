"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import type { FieldValues, SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { BsGithub, BsGoogle } from "react-icons/bs";

import Input from "@/app/components/inputs/input";
import Button from "@/app/components/button";
import AuthSocialButton from "./auth-social-button";

type Variant = "LOGIN" | "REGISTER";

const AuthForm = () => {
  const session = useSession();
  const router = useRouter();

  const [variant, setVariant] = useState<Variant>("LOGIN");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session?.status === "authenticated") {
      router.push("/users");
    }
  }, [session?.status, router]);

  const toggleVariant = useCallback(() => {
    if (variant === "LOGIN") setVariant("REGISTER");
    else setVariant("LOGIN");
  }, [variant]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    setIsLoading(true);

    if (variant === "REGISTER") {
      axios
        .post("/api/register", data)
        .then(() => signIn("credentials", data))
        .catch(() => toast.error("Something went wrong."))
        .finally(() => setIsLoading(false));
    }

    if (variant === "LOGIN") {
      signIn("credentials", {
        ...data,
        redirect: false,
      })
        .then((callback) => {
          if (callback?.error) {
            toast.error("Invalid credentials.");
          }

          if (callback?.ok && !callback?.error) {
            toast.success("You are logged in.");
            router.push("/users");
          }
        })
        .finally(() => setIsLoading(false));
    }
  };

  const socialAction = (action: "github" | "google") => {
    setIsLoading(true);

    signIn(action, {
      redirect: false,
    })
      .then((callback) => {
        if (callback?.error) toast.error("Invalid credentials.");

        if (callback?.ok && !callback?.error)
          toast.success("You are logged in.");
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white px-4 py-8 shadow-sm rounded-lg sm:px-10">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {variant === "REGISTER" && (
            <Input
              type="text"
              id="name"
              label="Nom Complet"
              placeholder="John Doe"
              register={register}
              errors={errors}
              disabled={isLoading}
            />
          )}
          <Input
            type="email"
            id="email"
            label="Adresse Courriel"
            placeholder="johndoe@email.com"
            register={register}
            errors={errors}
            disabled={isLoading}
          />

          <Input
            type="password"
            id="password"
            label="Mot de passe"
            placeholder="••••••••••"
            register={register}
            errors={errors}
            disabled={isLoading}
          />

          <Button type="submit" disabled={isLoading} fullWidth>
            {variant === "LOGIN" ? "Se Connecter" : "S'Enregistrer"}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div
                role="separator"
                className="w-full border-t border-gray-300"
                aria-hidden
              />
            </div>

            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">
                Ou Continuer avec
              </span>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <AuthSocialButton
              icon={BsGithub}
              isLoading={isLoading}
              onClick={() => socialAction("github")}
            />
            <AuthSocialButton
              icon={BsGoogle}
              isLoading={isLoading}
              onClick={() => socialAction("google")}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-center text-sm mt-6 px-2 text-gray-500">
          <p>
            {variant === "LOGIN"
              ? "Vous n'avez pas de compte?"
              : "Vous avez déjà un compte?"}
          </p>

          <a onClick={toggleVariant} className="underline cursor-pointer">
            {variant === "LOGIN" ? "Créer un compte" : "Se Connecter"}
          </a>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
