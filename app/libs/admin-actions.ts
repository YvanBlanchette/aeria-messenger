import prisma from "@/app/libs/prismadb";

const protectedAdminEmails = (process.env.ADMIN_EMAILS || "")
	.split(",")
	.map((e) => e.trim().toLowerCase())
	.filter(Boolean);

/**
 * An email listed in ADMIN_EMAILS env var cannot be demoted, banned,
 * or deleted via the admin UI. They can only be removed by changing
 * the env var.
 */
export function isProtectedAdminEmail(email: string | null | undefined): boolean {
	if (!email) return false;
	return protectedAdminEmails.includes(email.toLowerCase());
}

type LogActionInput = {
	adminId: string;
	adminEmail: string;
	action: "BAN" | "UNBAN" | "DELETE" | "PROMOTE" | "DEMOTE";
	targetId: string;
	targetEmail: string | null;
	metadata?: Record<string, unknown>;
};

export async function logAdminAction(input: LogActionInput) {
	try {
		await prisma.adminAction.create({
			data: {
				adminId: input.adminId,
				adminEmail: input.adminEmail,
				action: input.action,
				targetId: input.targetId,
				targetEmail: input.targetEmail,
				metadata: input.metadata ? JSON.stringify(input.metadata) : null,
			},
		});
	} catch (error) {
		// Logging failure shouldn't block the action itself
		console.error("Failed to write admin audit log:", error);
	}
}

/**
 * Soft delete: anonymizes user data but keeps the row so historical
 * conversations stay readable as "(utilisateur supprimé)". Also
 * cascades the cleanup of sensitive auth data so the user can't
 * log back in.
 */
export async function softDeleteUser(userId: string) {
	const anonymousSuffix = userId.slice(-8);

	await prisma.$transaction(async (tx) => {
		// Delete linked OAuth accounts so they can't log back in with Google/GitHub
		await tx.account.deleteMany({ where: { userId } });

		// Anonymize the user record
		await tx.user.update({
			where: { id: userId },
			data: {
				name: "(utilisateur supprimé)",
				email: `deleted-${anonymousSuffix}@deleted.local`,
				hashedPassword: null,
				image: null,
				emailVerified: null,
				deletedAt: new Date(),
				bannedAt: new Date(), // prevent any leftover session from working
			},
		});
	});
}
