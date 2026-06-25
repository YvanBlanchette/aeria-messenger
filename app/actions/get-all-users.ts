import prisma from "@/app/libs/prismadb";
import { isCurrentUserAdmin } from "@/app/libs/admin-check";

type GetAllUsersOptions = {
	search?: string;
};

const getAllUsers = async ({ search }: GetAllUsersOptions = {}) => {
	const isAdmin = await isCurrentUserAdmin();
	if (!isAdmin) return [];

	try {
		const users = await prisma.user.findMany({
			where: search
				? {
						OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }],
					}
				: undefined,
			orderBy: { createdAt: "desc" },
			include: {
				_count: {
					select: {
						messages: true,
						conversations: true,
					},
				},
			},
		});

		return users;
	} catch (error: unknown) {
		return [];
	}
};

export default getAllUsers;
