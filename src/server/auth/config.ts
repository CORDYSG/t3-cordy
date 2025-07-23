import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import { db } from "@/server/db";

import type { UserRole } from '@prisma/client'
/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
      // ...other properties
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    // ...other properties
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    DiscordProvider,
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      id: "telegram",
      name: "Telegram",
      credentials: {
        telegramId: { label: "Telegram ID", type: "text" },
        username: { label: "Username", type: "text" },
      },
      async authorize(credentials, req) {
        // Validate user via DB or just pass for now
        const user = {
          id: credentials?.telegramId?.toString(),
          name: credentials?.username?.toString(),
          role: "USER" as UserRole, // Default role for new users
        };

        // You could optionally check DB and create user if needed
        if (user.id && user.name) {
          return user;
        }
        return null;
      },
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(db) as any,
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        role: user.role, // Include role in session
      },
    }),
    async redirect({ url, baseUrl }) {
      if (url === '/api/auth/signout' || url.includes('signout')) {
        return baseUrl + '/auth/signin';
      }
      return baseUrl + '/user-check';
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
} satisfies NextAuthConfig;