import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authenticate } from "@/server/auth/service";
import { getDb } from "@/server/db";
import { getAuthSecret } from "@/server/env";
export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  secret: getAuthSecret(),
  pages: { signIn: "/ingresar" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  providers: [Credentials({
    credentials: { username: { label: "Usuario" }, password: { label: "Contraseña", type: "password" } },
    authorize: credentials => authenticate(getDb(), credentials, getAuthSecret()),
  })],
  callbacks: {
    jwt({ token, user }) {
      if (user) { token.sub = user.id; token.sessionVersion = user.sessionVersion; }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.sessionVersion = typeof token.sessionVersion === "number" ? token.sessionVersion : 0;
      return session;
    },
  },
  logger: { error(error) { console.error(JSON.stringify({ event: "authentication_error", category: "type" in error ? error.type : "AUTH_FAILURE" })); } },
}));
