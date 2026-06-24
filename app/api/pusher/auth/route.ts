import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { pusherServer } from "@/app/libs/pusher";
import { authOptions } from "@/app/config/authOptions";

export async function POST(req: Request) {
	const session = await getServerSession(authOptions);

	if (!session?.user?.email) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	// Pusher sends auth payload as application/x-www-form-urlencoded
	const formData = await req.formData();
	const socketId = formData.get("socket_id") as string;
	const channel = formData.get("channel_name") as string;

	if (!socketId || !channel) {
		return new NextResponse("Missing socket_id or channel_name", { status: 400 });
	}

	const data = {
		user_id: session.user.email,
	};

	const authResponse = pusherServer.authorizeChannel(socketId, channel, data);

	return NextResponse.json(authResponse);
}
