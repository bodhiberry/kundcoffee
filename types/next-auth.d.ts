import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "MANAGER" | "CASHIER" | "SUPER_ADMIN" | "SUPPORT_ADMIN" | "FINANCE_ADMIN";
      storeId?: string | null;
      permissions?: string[];
      emailVerified?: Date | null;
      isSetupComplete?: boolean;
      trialEndsAt?: Date | null;
      isPlatformUser?: boolean;
      storeStatus?: "TRIAL" | "ACTIVE" | "EXPIRED" | "SUSPENDED" | null;
      storeSuspended?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "ADMIN" | "MANAGER" | "CASHIER" | "SUPER_ADMIN" | "SUPPORT_ADMIN" | "FINANCE_ADMIN";
    storeId?: string | null;
    permissions?: string[];
    emailVerified?: Date | null;
    isSetupComplete?: boolean;
    trialEndsAt?: Date | null;
    isPlatformUser?: boolean;
    storeStatus?: "TRIAL" | "ACTIVE" | "EXPIRED" | "SUSPENDED" | null;
    storeSuspended?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "MANAGER" | "CASHIER" | "SUPER_ADMIN" | "SUPPORT_ADMIN" | "FINANCE_ADMIN";
    storeId?: string | null;
    permissions?: string[];
    emailVerified?: Date | null;
    isSetupComplete?: boolean;
    trialEndsAt?: Date | null;
    isPlatformUser?: boolean;
    storeStatus?: "TRIAL" | "ACTIVE" | "EXPIRED" | "SUSPENDED" | null;
    storeSuspended?: boolean;
  }
}
