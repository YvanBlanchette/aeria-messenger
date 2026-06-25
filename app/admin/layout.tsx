import type { PropsWithChildren } from "react";
import Link from "next/link";

import { requireAdmin } from "@/app/libs/admin-check";

export const dynamic = "force-dynamic";

const AdminLayout = async ({ children }: PropsWithChildren) => {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-lg font-bold text-[#C9A84C]"
            >
              Tableau de bord
            </Link>
            <Link
              href="/admin/users"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Utilisateurs
            </Link>
          </div>
          <Link
            href="/conversations"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Retour à l&apos;app
          </Link>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
};

export default AdminLayout;