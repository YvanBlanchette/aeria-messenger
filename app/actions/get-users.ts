import prisma from "@/app/libs/prismadb";

import getCurrentUser from "@/app/actions/get-current-user";
import { getFriendIds } from "@/app/libs/connections";

const getUsers = async () => {
	const currentUser = await getCurrentUser();

	if (!currentUser?.id) return [];

	try {
		const friendIds = await getFriendIds(currentUser.id);

		if (friendIds.length === 0) return [];

		const users = await prisma.user.findMany({
			orderBy: {
				createdAt: "desc",
			},
			where: {
				id: { in: friendIds },
				deletedAt: null, // also hide soft-deleted users
			},
		});

		return users;
	} catch (error: unknown) {
		return [];
	}
};

export default getUsers;
