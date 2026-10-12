import type { AccountType, Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: Role;
    accountType?: AccountType;
  }
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role?: Role;
      accountType?: AccountType;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    accountType?: AccountType;
  }
}
