import { z } from "zod";

import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import db from "./lib/prisma";
import {JWT} from "next-auth/jwt";

import {  NextAuthConfig } from "next-auth";
import { decl } from "postcss";

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's name. */
      id: string ;
      name: string ;
      email: string ;
      role: string |null; 
      image: string ;
      printName: string | null;
      isFirstLogin: boolean;
    };
  }
}



declare module "@auth/core/jwt" {
  interface JWT {
    id: string | undefined;
    role: string | null;
    printName: string | null;
    isFirstLogin: boolean;
  }
}
export default {
  adapter: PrismaAdapter(db),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        pasword: { label: "Password", type: "password" },
      },      async authorize(credentials) {
        const validatedFields = CredentialsSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;

        const user = await db.user.findUnique({
          where: { email: email }, // Look up the user by email
        });

        // 2. If no user or no password is found, return null
        if (!user || !user.password) {
          return null;
        }

        // 3. Compare the password directly (no hashing)
        const passwordsMatch = password === user.password;

        // 4. If passwords don't match, return null
        if (!passwordsMatch) {
          return null;
        }

        // 5. Return the user if authentication is successful
        return user;
      },
    }),

    // GitHub,
    // Google
  ],
  pages: {
    
    signIn: "/",
    error: "/",
  },
  secret: "hbsidufgkiasubd",

  session: {
    strategy: "jwt",
  },  callbacks: {
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

    session: async ({ session, token }) => {
      if (token.id) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.printName = token.printName ?? null;
        session.user.isFirstLogin = token.isFirstLogin;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Handle redirects after sign in
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
} satisfies NextAuthConfig;
