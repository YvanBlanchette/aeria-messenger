import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireAdmin } from "@/app/libs/admin-check";
import { isProtectedAdminEmail } from "@/app/libs/admin-actions";
import prisma from "@/app/libs/prismadb";
import AdminUserActions from "./components/admin-user-actions";

type IParams = {
  id: string;
};

const AdminUserDetailPage = async ({
  params,
}: {
  params: Promise<IParams>;
}) => {
  const admin = await requireAdmin();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      accounts: { select: { provider: true, providerAccountId: true } },
      conversations: {
        select: {
          id: true,
          name: true,
          isGroup: true,
          lastMessageAt: true,
          _count: { select: { messages: true } },
        },
        orderBy: { lastMessageAt: "desc" },
        take: 20,
      },
      _count: {
        select: {
          messages: true,
          conversations: true,
          reactions: true,
        },
      },
    },
  });

  if (!user) notFound();

  const providers = user.accounts.map((a) => a.provider);
  const hasPassword = !!user.hashedPassword;

  const loginMethods = [
    ...providers,
    hasPassword ? "Email/mot de passe" : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Liste des utilisateurs
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name || ""}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200" />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user.name || "(sans nom)"}
              </h1>
              <p className="text-sm text-gray-500">{user.email || "—"}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {user.role === "ADMIN" && (
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#C9A84C]/20 text-[#9A6F14]">
                Admin
              </span>
            )}
            {user.bannedAt && (
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                Banni le{" "}
                {format(new Date(user.bannedAt), "d MMM yyyy", { locale: fr })}
              </span>
            )}
            {user.deletedAt && (
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                Supprimé le{" "}
                {format(new Date(user.deletedAt), "d MMM yyyy", { locale: fr })}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
        <AdminUserActions
          userId={user.id}
          isBanned={!!user.bannedAt}
          isAdmin={user.role === "ADMIN"}
          isDeleted={!!user.deletedAt}
          isSelf={user.id === admin.id}
          isProtected={isProtectedAdminEmail(user.email)}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Messages envoyés" value={user._count.messages} />
        <Stat label="Conversations" value={user._count.conversations} />
        <Stat label="Réactions" value={user._count.reactions} />
        <Stat
          label="Inscrit le"
          value={format(new Date(user.createdAt), "d MMM yyyy", {
            locale: fr,
          })}
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Méthodes de connexion
        </h2>
        <div className="flex flex-wrap gap-2">
          {loginMethods.length === 0 ? (
            <span className="text-sm text-gray-500">Aucune</span>
          ) : (
            loginMethods.map((method) => (
              <span
                key={method as string}
                className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize"
              >
                {method}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Conversations récentes
          </h2>
        </div>
        {user.conversations.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-500 text-center">
            Aucune conversation
          </p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {user.conversations.map((conv) => (
              <li
                key={conv.id}
                className="px-6 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {conv.name ||
                      (conv.isGroup
                        ? "Groupe sans nom"
                        : "Conversation 1-on-1")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {conv._count.messages} messages
                  </p>
                </div>
                <span
                  className="text-xs text-gray-400"
                  suppressHydrationWarning
                >
                  {format(new Date(conv.lastMessageAt), "d MMM yyyy", {
                    locale: fr,
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
  </div>
);

export default AdminUserDetailPage;