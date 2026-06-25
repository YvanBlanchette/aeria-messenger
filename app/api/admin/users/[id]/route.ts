import { NextResponse } from "next/server";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/get-current-user";
import { logAdminAction, isProtectedAdminEmail, softDeleteUser } from "@/app/libs/admin-actions";

type IParams = { id: string };

export async function DELETE(_req: Request, { params }: { params: Promise<IParams> }) {
	const admin = await getCurrentUser();
	if (!admin || admin.role !== "ADMIN") {
		return new NextResponse("Forbidden", { status: 403 });
	}

	const { id } = await params;

	if (id === admin.id) {
		return new NextResponse("Vous ne pouvez pas vous supprimer vous-même.", {
			status: 400,
		});
	}

	const target = await prisma.user.findUnique({ where: { id } });
	if (!target) return new NextResponse("Utilisateur introuvable.", { status: 404 });

	if (isProtectedAdminEmail(target.email)) {
		return new NextResponse("Cet utilisateur est protégé par la configuration ADMIN_EMAILS.", { status: 400 });
	}

	if (target.deletedAt) {
		return new NextResponse("Utilisateur déjà supprimé.", { status: 400 });
	}

	const originalEmail = target.email;

	await softDeleteUser(target.id);

	await logAdminAction({
		adminId: admin.id,
		adminEmail: admin.email || "",
		action: "DELETE",
		targetId: target.id,
		targetEmail: originalEmail,
	});

	return NextResponse.json({ success: true });
}
