import { NextResponse } from "next/server";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/get-current-user";
import { logAdminAction, isProtectedAdminEmail } from "@/app/libs/admin-actions";

type IParams = { id: string };

export async function POST(_req: Request, { params }: { params: Promise<IParams> }) {
	const admin = await getCurrentUser();
	if (!admin || admin.role !== "ADMIN") {
		return new NextResponse("Forbidden", { status: 403 });
	}

	const { id } = await params;

	if (id === admin.id) {
		return new NextResponse("Vous ne pouvez pas modifier votre propre rôle.", {
			status: 400,
		});
	}

	const target = await prisma.user.findUnique({ where: { id } });
	if (!target) return new NextResponse("Utilisateur introuvable.", { status: 404 });

	const willPromote = target.role !== "ADMIN";

	// Demoting a protected admin is forbidden (their role gets re-promoted
	// at next session anyway, so the action would be pointless).
	if (!willPromote && isProtectedAdminEmail(target.email)) {
		return new NextResponse("Cet administrateur est protégé par la configuration ADMIN_EMAILS.", { status: 400 });
	}

	await prisma.user.update({
		where: { id },
		data: { role: willPromote ? "ADMIN" : "USER" },
	});

	await logAdminAction({
		adminId: admin.id,
		adminEmail: admin.email || "",
		action: willPromote ? "PROMOTE" : "DEMOTE",
		targetId: target.id,
		targetEmail: target.email,
	});

	return NextResponse.json({ success: true, role: willPromote ? "ADMIN" : "USER" });
}
