import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";

import getCurrentUser from "@/app/actions/get-current-user";
import { pusherServer } from "@/app/libs/pusher";
import { getFriendIds } from "@/app/libs/connections";

export async function POST(request: Request) {
	try {
		const currentUser = await getCurrentUser();
		const body = await request.json();
		const { userId, isGroup, members, name } = body;

		if (!currentUser?.id || !currentUser?.email) return new NextResponse("Unauthorized.", { status: 401 });

		if (isGroup && (!members || members.length < 2 || !name)) return new NextResponse("Invalid data.", { status: 400 });

		// Validate that targets are friends
		const friendIds = await getFriendIds(currentUser.id);

		if (isGroup) {
			const memberIds = members.map((m: { value: string }) => m.value);
			const allMembersAreFriends = memberIds.every((id: string) => friendIds.includes(id));
			if (!allMembersAreFriends) {
				return new NextResponse("Vous devez être connecté avec tous les membres.", {
					status: 403,
				});
			}
		} else {
			if (!friendIds.includes(userId)) {
				return new NextResponse("Vous devez être connecté avec cette personne.", {
					status: 403,
				});
			}
		}

		if (isGroup) {
			const newConversation = await prisma.conversation.create({
				data: {
					name,
					isGroup,
					users: {
						connect: [
							...members.map((member: { value: string }) => ({
								id: member.value,
							})),
							{
								id: currentUser.id,
							},
						],
					},
				},
				include: {
					users: true,
				},
			});

			newConversation.users.forEach((user) => {
				if (user.email) {
					pusherServer.trigger(user.email, "conversation:new", newConversation);
				}
			});

			return NextResponse.json(newConversation);
		}

		const existingConversations = await prisma.conversation.findMany({
			where: {
				AND: [{ users: { some: { id: currentUser.id } } }, { users: { some: { id: userId } } }],
			},
		});

		const singleConversation = existingConversations[0];

		if (singleConversation) return NextResponse.json(singleConversation);

		const newConversation = await prisma.conversation.create({
			data: {
				users: {
					connect: [
						{
							id: currentUser.id,
						},
						{
							id: userId,
						},
					],
				},
			},
			include: {
				users: true,
			},
		});

		newConversation.users.map((user) => {
			if (user.email) {
				pusherServer.trigger(user.email, "conversation:new", newConversation);
			}
		});

		return NextResponse.json(newConversation);
	} catch (error: unknown) {
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
