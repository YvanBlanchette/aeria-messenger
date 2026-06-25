import { redirect } from "next/navigation";

import getCurrentUser from "@/app/actions/get-current-user";

/**
 * Server-side guard for admin pages.
 * Redirects to /conversations if user is not authenticated or not an admin.
 * Returns the admin user when access is granted.
 */
export async function requireAdmin() {
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		redirect("/");
	}

	if (currentUser.role !== "ADMIN") {
		redirect("/conversations");
	}

	return currentUser;
}

/**
 * Non-redirecting check, useful for hiding/showing UI elements.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
	const currentUser = await getCurrentUser();
	return currentUser?.role === "ADMIN";
}
