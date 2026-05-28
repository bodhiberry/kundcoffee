import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const host = req?.headers?.host || "";
        const isAdminSubdomain = host.startsWith("admin.");

        if (isAdminSubdomain) {
          // Platform / Super Admin login
          const platformUser = await prisma.platformUser.findUnique({
            where: { email: credentials.email },
          });

          if (!platformUser || !platformUser.isActive) return null;

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            platformUser.password,
          );
          if (!isPasswordCorrect) return null;

          return {
            id: platformUser.id,
            email: platformUser.email,
            name: platformUser.name,
            role: platformUser.role,
            isPlatformUser: true,
          } as any;
        } else {
          // Store/Tenant login
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              store: {
                select: {
                  status: true,
                  isSuspended: true,
                },
              },
            },
          });

          if (!user) return null;

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.password,
          );
          if (!isPasswordCorrect) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            storeId: user.storeId || "",
            permissions: user.permissions || [],
            emailVerified: user.emailVerified,
            isSetupComplete: user.isSetupComplete,
            trialEndsAt: user.trialEndsAt,
            isPlatformUser: false,
            storeStatus: user.store?.status || "TRIAL",
            storeSuspended: user.store?.isSuspended || false,
          };
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.permissions = user.permissions || [];
        token.storeId = user.storeId || null;
        token.emailVerified = user.emailVerified || null;
        token.isSetupComplete = user.isSetupComplete || false;
        token.trialEndsAt = user.trialEndsAt || null;
        token.isPlatformUser = (user as any).isPlatformUser || false;
        token.storeStatus = (user as any).storeStatus || null;
        token.storeSuspended = (user as any).storeSuspended || false;
      }

      // Always fetch the latest user role, permissions, and setup status from DB
      // to ensure real-time privilege updates without requiring user logout.
      const userId = (token.id as string) || (user?.id as string);
      if (userId) {
        try {
          if (token.isPlatformUser) {
            const dbPlatformUser = await prisma.platformUser.findUnique({
              where: { id: userId },
              select: {
                role: true,
                isActive: true,
              },
            });

            if (dbPlatformUser) {
              token.role = dbPlatformUser.role;
              if (!dbPlatformUser.isActive) {
                return {} as any; // Deactivated
              }
            }
          } else {
            const dbUser = await prisma.user.findUnique({
              where: { id: userId },
              select: {
                role: true,
                permissions: true,
                emailVerified: true,
                isSetupComplete: true,
                storeId: true,
                store: {
                  select: {
                    status: true,
                    isSuspended: true,
                  },
                },
              },
            });

            if (dbUser) {
              token.role = dbUser.role;
              token.permissions = dbUser.permissions;
              token.emailVerified = dbUser.emailVerified;
              token.isSetupComplete = dbUser.isSetupComplete;
              token.storeId = dbUser.storeId;
              token.storeStatus = dbUser.store?.status || null;
              token.storeSuspended = dbUser.store?.isSuspended || false;
            }
          }
        } catch (error) {
          console.error("Error fetching latest user details in JWT callback:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.permissions = (token.permissions as string[]) || [];
        session.user.storeId = token.storeId as string;
        session.user.emailVerified = token.emailVerified as Date | null;
        session.user.isSetupComplete = token.isSetupComplete as boolean;
        session.user.trialEndsAt = token.trialEndsAt as Date;
        session.user.isPlatformUser = token.isPlatformUser as boolean;
        session.user.storeStatus = token.storeStatus as any;
        session.user.storeSuspended = token.storeSuspended as boolean;
      }
      return session;
    },
  },
};
