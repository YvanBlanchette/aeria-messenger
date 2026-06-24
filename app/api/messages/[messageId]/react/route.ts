import { NextResponse } from "next/server";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/get-current-user";
import { pusherServer } from "@/app/libs/pusher";

type IParams = {
	messageId: string;
};

export async function POST(req: Request, { params }: { params: Promise<IParams> }) {
	try {
		const { messageId } = await params;
		const currentUser = await getCurrentUser();
		const body = await req.json();
		const { emoji } = body;

		if (!currentUser?.id || !currentUser?.email) {
			return new NextResponse("Unauthorized.", { status: 401 });
		}

		if (typeof emoji !== "string" || emoji.length === 0 || emoji.length > 16) {
			return new NextResponse("Invalid emoji.", { status: 400 });
		}

		const message = await prisma.message.findUnique({
			where: { id: messageId },
			select: { id: true, conversationId: true },
		});

		if (!message) {
			return new NextResponse("Message not found.", { status: 404 });
		}

		// Toggle: if the same user already has this exact emoji on this message,
		// remove it. Otherwise create it.
		const existing = await prisma.reaction.findUnique({
			where: {
				userId_messageId_emoji: {
					userId: currentUser.id,
					messageId,
					emoji,
				},
			},
		});

		if (existing) {
			await prisma.reaction.delete({ where: { id: existing.id } });
		} else {
			await prisma.reaction.create({
				data: {
					emoji,
					userId: currentUser.id,
					messageId,
				},
			});
		}

		// Re-fetch the full message with the same shape as everywhere else,
		// so the realtime payload matches FullMessageType.
		const updatedMessage = await prisma.message.findUnique({
			where: { id: messageId },
			include: {
				sender: true,
				seen: true,
				reactions: { include: { user: true } },
			},
		});

		if (!updatedMessage) {
			return new NextResponse("Message not found.", { status: 404 });
		}

		await pusherServer.trigger(message.conversationId, "message:update", updatedMessage);

		return NextResponse.json(updatedMessage);
	} catch (error) {
		console.error("ERROR_REACTION:", error);
		return new NextResponse("Internal Server Error.", { status: 500 });
	}
}
