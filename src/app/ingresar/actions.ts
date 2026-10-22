"use server";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { loginSchema } from "@/shared/contracts/auth";
export async function login(_previous: { error: string }, form: FormData) {
  const parsed = loginSchema.safeParse({ username: form.get("username"), password: form.get("password") });
  if (!parsed.success) return { error: "Revisá el usuario y la contraseña." };
  try {
    await signIn("credentials", { ...parsed.data, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "No pudimos ingresar. Revisá tus datos o intentá nuevamente más tarde." };
    throw error;
  }
  return { error: "" };
}
