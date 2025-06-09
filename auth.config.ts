import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import Credentials from "next-auth/providers/credentials";
import { CredentialsSchema } from "@/schemas";
import { compare } from 'bcrypt';

export const authConfig: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  // Add this line to bypass CSRF checks (TEMPORARY FOR DEBUGGING ONLY)
  skipCSRFCheck: true,
  debug: true,
  pages: {
    signIn: "/",
    error: "/",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }, // Fixed the typo "pasword" to "password"
      },
      async authorize(credentials) {
        const validatedFields = CredentialsSchema.safeParse({
            email: credentials.email,
            password: credentials.password // Fixed the typo "pasword" to "password"
        });

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;
          
          const user = await db.user.findUnique({
            where: {
              email,
            }
          });

          if (!user || !user.password) {
            return null;
          }

          // Check if passwords match (since you're not using hashing)
          if (password !== user.password) {
            return null;
          }

          return {
            id: user.id,
            name: user.printName,
            email: user.email,
            role: user.role,
            isFirstLogin: user.isFirstLogin,
          };
        }

        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const DBuser = await db.user.findUnique({
          where: {
            id: user.id,
          },
        });
        token.id = DBuser?.id;
        token.role = DBuser?.role ?? null;
        token.printName = DBuser?.printName ?? null;
        token.isFirstLogin = DBuser?.isFirstLogin ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.printName = token.printName as string;
        session.user.isFirstLogin = token.isFirstLogin as boolean;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax", 
        path: "/",
        secure: true
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: true
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true
      }
    }
  },
};
