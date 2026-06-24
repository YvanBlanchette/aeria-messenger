import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/get-current-user";

const getConversations = async () => {
	const currentUser = await getCurrentUser();

	if (!currentUser?.id) return [];

	try {
		const conversations = await prisma.conversation.findMany({
			orderBy: {
				lastMessageAt: "desc",
			},
			where: {
				users: {
					some: {
						id: currentUser.id,
					},
				},
			},
			include: {
				users: true,
				messages: {
					include: {
						sender: true,
						seen: true,
						reactions: {
							include: {
								user: true,
							},
						},
					},
				},
			},
		});

		return conversations;
	} catch (error: unknown) {
		return [];
	}
};

export default getConversations;
