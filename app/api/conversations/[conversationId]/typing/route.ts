import { NextResponse } from "next/server";

import getCurrentUser from "@/app/actions/get-current-user";
import { pusherServer } from "@/app/libs/pusher";

type IParams = {
	conversationId: string;
};

export async function POST(_req: Request, { params }: { params: Promise<IParams> }) {
	try {
		const { conversationId } = await params;
		const currentUser = await getCurrentUser();

		if (!currentUser?.id || !currentUser?.email) {
			return new NextResponse("Unauthorized.", { status: 401 });
		}

		await pusherServer.trigger(conversationId, "typing", {
			userEmail: currentUser.email,
			name: currentUser.name || "Quelqu'un",
		});

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("ERROR_TYPING:", error);
		return new NextResponse("Internal Server Error.", { status: 500 });
	}
}
