import prisma from "@/app/libs/prismadb";
import { Prisma } from "@prisma/client";

export type RelationStatus =
	| "NONE" // no connection record exists
	| "FRIENDS" // accepted in either direction
	| "PENDING_OUTGOING" // I sent a request, they haven't acted
	| "PENDING_INCOMING" // they sent me a request, I haven't acted
	| "BLOCKED_BY_ME" // I blocked them
	| "BLOCKED_BY_THEM" // they blocked me
	| "SELF"; // same user

/**
 * Determines the relationship between two users.
 * Symmetric for FRIENDS, asymmetric for everything else.
 */
export async function getRelationStatus(myUserId: string, otherUserId: string): Promise<RelationStatus> {
	if (myUserId === otherUserId) return "SELF";

	const connections = await prisma.connection.findMany({
		where: {
			OR: [
				{ requesterId: myUserId, recipientId: otherUserId },
				{ requesterId: otherUserId, recipientId: myUserId },
			],
		},
	});

	// Block takes priority over everything
	const blockedByMe = connections.find((c) => c.status === "BLOCKED" && c.requesterId === myUserId && c.recipientId === otherUserId);
	if (blockedByMe) return "BLOCKED_BY_ME";

	const blockedByThem = connections.find((c) => c.status === "BLOCKED" && c.requesterId === otherUserId && c.recipientId === myUserId);
	if (blockedByThem) return "BLOCKED_BY_THEM";

	const accepted = connections.find((c) => c.status === "ACCEPTED");
	if (accepted) return "FRIENDS";

	const outgoing = connections.find((c) => c.status === "PENDING" && c.requesterId === myUserId && c.recipientId === otherUserId);
	if (outgoing) return "PENDING_OUTGOING";

	const incoming = connections.find((c) => c.status === "PENDING" && c.requesterId === otherUserId && c.recipientId === myUserId);
	if (incoming) return "PENDING_INCOMING";

	return "NONE";
}

/**
 * Returns the IDs of all users I'm currently friends with.
 * Used to filter the sidebar and conversation creation.
 */
export async function getFriendIds(myUserId: string): Promise<string[]> {
	const friendships = await prisma.connection.findMany({
		where: {
			status: "ACCEPTED",
			OR: [{ requesterId: myUserId }, { recipientId: myUserId }],
		},
		select: { requesterId: true, recipientId: true },
	});

	return friendships.map((f) => (f.requesterId === myUserId ? f.recipientId : f.requesterId));
}

/**
 * Returns the IDs of users I've blocked OR who have blocked me.
 * Used to hide these users from search results and listings.
 */
export async function getBlockedRelatedIds(myUserId: string): Promise<string[]> {
	const blocks = await prisma.connection.findMany({
		where: {
			status: "BLOCKED",
			OR: [{ requesterId: myUserId }, { recipientId: myUserId }],
		},
		select: { requesterId: true, recipientId: true },
	});

	return blocks.map((b) => (b.requesterId === myUserId ? b.recipientId : b.requesterId));
}

/**
 * Helper to find the connection record between two users (any direction).
 * Returns undefined if none exists.
 */
export async function findConnectionBetween(userA: string, userB: string): Promise<Prisma.ConnectionGetPayload<{}> | null> {
	return prisma.connection.findFirst({
		where: {
			OR: [
				{ requesterId: userA, recipientId: userB },
				{ requesterId: userB, recipientId: userA },
			],
		},
	});
}
