import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getUserFullName } from "@/utils/helper";

const authOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Check in the users table first
          let user = await prisma.users.findUnique({
            where: { email: credentials.email, deletedAt: null },
          });
          // If no user found in the users table, check the team_members table

          if (user) {

            if (!user.isActive) {
              throw new Error("Account not activated. Please check your email.");
            }
            console.log(user , "user");
            if (!user.password) {
              throw new Error("Please complete your password setup first.");
            }
            const isPasswordCorrect = await bcrypt.compare(
              credentials.password,
              user.password
            );
console.log(isPasswordCorrect , "isPasswordCorrect");
            if (isPasswordCorrect) {
              return user;
            }
          }
          return null;
        } catch (err) {
          throw new Error(err.message);
        }
      },
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (account?.provider === "credentials") {
          return true;
        }

        if (account?.provider === "github") {
          const existingUser = await prisma.users.findUnique({
            where: { email: user.email, deletedAt: null },
          });


          if (!existingUser) {
            await prisma.users.create({
              data: {
                email: user.email,
                role: "user",
              },
            });
          }
          return true;
        }

        if (account?.provider === "google") {
          const existingUser = await prisma.users.findUnique({
            where: { email: user.email, deletedAt: null },
          });

          if (!existingUser) {
            await prisma.users.create({
              data: {
                email: user.email,
                role: "user",
              },
            });
          }
          return true;
        }

        return true;
      } catch (err) {
        console.log("Error saving user", err);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        const foundUser = await prisma.users.findUnique({
          where: { email: user.email, deletedAt: null },
        });

        if (foundUser) {
          token.id = foundUser.id;
          token.role = foundUser.role;
          token.email = foundUser.email;
          token.name = getUserFullName(foundUser.firstName, foundUser.lastName);
          token.preferredLocale = foundUser.preferredLocale || null;

        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.preferredLocale = token.preferredLocale || null;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
