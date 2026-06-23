import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";

export class EmailNotVerifiedError extends CredentialsSignin {
  code = "email-not-verified";
}

export class TotpRequiredError extends CredentialsSignin {
  code = "totp-required";
}

export class TotpInvalidError extends CredentialsSignin {
  code = "totp-invalid";
}

export class AccountSuspendedError extends CredentialsSignin {
  code = "account-suspended";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        totpCode: {},
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const totpCode = credentials?.totpCode as string | undefined;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user || !user.passwordHash) return null;

        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) {
          await prisma.loginEvent.create({
            data: { userId: user.id, success: false },
          });
          return null;
        }

        if (user.isSuspended) {
          throw new AccountSuspendedError();
        }

        if (!user.emailVerified) {
          throw new EmailNotVerifiedError();
        }

        if (user.twoFactorEnabled) {
          if (!totpCode) {
            throw new TotpRequiredError();
          }
          const valid = authenticator.verify({ token: totpCode, secret: user.twoFactorSecret! });
          if (!valid) {
            throw new TotpInvalidError();
          }
        }

        await prisma.loginEvent.create({
          data: { userId: user.id, success: true },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
});
