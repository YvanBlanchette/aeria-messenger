import bcrypt from "bcrypt";
import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import prisma from "@/app/libs/prismadb";

const adminEmails = (process.env.ADMIN_EMAILS || "")
	.split(",")
	.map((e) => e.trim().toLowerCase())
	.filter(Boolean);

export const authOptions: AuthOptions = {
	adapter: PrismaAdapter(prisma),
	providers: [
		GithubProvider({
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
		}),
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		}),
		CredentialsProvider({
			name: "credentials",
			credentials: {
				email: {
					label: "email",
					type: "text",
				},
				password: {
					label: "password",
					type: "password",
				},
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) throw new Error("Invalid credentials.");

				const user = await prisma.user.findUnique({
					where: {
						email: credentials.email,
					},
				});

				if (!user || !user?.hashedPassword) throw new Error("Invalid credentials.");

				if (user.bannedAt) throw new Error("Account suspended.");

				const isCorrectPassword = await bcrypt.compare(credentials.password, user.hashedPassword);

				if (!isCorrectPassword) throw new Error("Invalid credentials.");

				return user;
			},
		}),
	],
	callbacks: {
		async signIn({ user }) {
			// Block banned users from logging in (covers OAuth providers;
			// credentials provider checks this in `authorize` above).
			if (user?.email) {
				const dbUser = await prisma.user.findUnique({
					where: { email: user.email },
					select: { bannedAt: true },
				});
				if (dbUser?.bannedAt) return false;
			}
			return true;
		},
		async session({ session, token }) {
			// Fetch fresh user data so role/banned status reflect changes
			// without forcing a re-login.
			if (session.user?.email) {
				const dbUser = await prisma.user.findUnique({
					where: { email: session.user.email },
					select: { id: true, role: true, bannedAt: true },
				});

				if (dbUser) {
					// Auto-promote configured admin emails on every session refresh.
					// If their role is still USER but they're in ADMIN_EMAILS, promote.
					const emailLower = session.user.email.toLowerCase();
					if (adminEmails.includes(emailLower) && dbUser.role !== "ADMIN") {
						await prisma.user.update({
							where: { id: dbUser.id },
							data: { role: "ADMIN" },
						});
						dbUser.role = "ADMIN";
					}

					(
						session.user as typeof session.user & {
							id: string;
							role: "USER" | "ADMIN";
							bannedAt: Date | null;
						}
					).id = dbUser.id;
					(
						session.user as typeof session.user & {
							id: string;
							role: "USER" | "ADMIN";
							bannedAt: Date | null;
						}
					).role = dbUser.role;
					(
						session.user as typeof session.user & {
							id: string;
							role: "USER" | "ADMIN";
							bannedAt: Date | null;
						}
					).bannedAt = dbUser.bannedAt;
				}
			}
			return session;
		},
	},
	debug: process.env.NODE_ENV === "development",
	session: {
		strategy: "jwt",
	},
	secret: process.env.NEXTAUTH_SECRET,
};
