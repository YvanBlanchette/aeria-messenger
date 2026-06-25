import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireAdmin } from "@/app/libs/admin-check";
import getAllUsers from "@/app/actions/get-all-users";
import UserSearch from "./components/user-search";

type SearchParams = {
  q?: string;
};

const AdminUsersPage = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) => {
  await requireAdmin();
  const { q } = await searchParams;
  const users = await getAllUsers({ search: q });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
        <p className="text-sm text-gray-500">
          {users.length} {users.length === 1 ? "résultat" : "résultats"}
        </p>
      </div>

      <UserSearch initialValue={q || ""} />

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rôle
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Messages
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Inscrit le
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                  Aucun utilisateur trouvé
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-sm font-medium text-[#9A6F14] hover:underline"
                  >
                    {user.name || "(sans nom)"}
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {user.email || "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {user.role === "ADMIN" ? (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#C9A84C]/20 text-[#9A6F14]">
                      Admin
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">Utilisateur</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {user.bannedAt ? (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      Banni
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Actif
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {user._count.messages}
                </td>
                <td
                  className="px-4 py-3 whitespace-nowrap text-sm text-gray-500"
                  suppressHydrationWarning
                >
                  {format(new Date(user.createdAt), "d MMM yyyy", {
                    locale: fr,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersPage;