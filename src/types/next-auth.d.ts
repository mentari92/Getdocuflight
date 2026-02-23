import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

/**
 * [H1 FIX] Extend NextAuth types with `role` field.
 * Eliminates all `any` casts across auth.ts and admin-auth.ts.
 */

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        role?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id?: string;
        role?: string;
    }
}
