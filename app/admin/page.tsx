import { requireAdmin } from "@/app/libs/admin-check";
import prisma from "@/app/libs/prismadb";

const AdminHomePage = async () => {
  const admin = await requireAdmin();

  const [totalUsers, totalConversations, totalMessages, bannedUsers] =
    await Promise.all([
      prisma.user.count(),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.user.count({ where: { bannedAt: { not: null } } }),
    ]);

  const stats = [
    { label: "Utilisateurs", value: totalUsers },
    { label: "Conversations", value: totalConversations },
    { label: "Messages", value: totalMessages },
    { label: "Bannis", value: bannedUsers },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour {admin.name || "admin"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Vue d&apos;ensemble du système
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminHomePage;