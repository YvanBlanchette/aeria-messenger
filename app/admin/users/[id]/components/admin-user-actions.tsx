"use client";

import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Props = {
  userId: string;
  isBanned: boolean;
  isAdmin: boolean;
  isDeleted: boolean;
  isSelf: boolean;
  isProtected: boolean;
};

const AdminUserActions: React.FC<Props> = ({
  userId,
  isBanned,
  isAdmin,
  isDeleted,
  isSelf,
  isProtected,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const cannotAct = isSelf || isProtected || isDeleted;

  const handle = async (
    action: "ban" | "role" | "delete",
    confirmText?: string
  ) => {
    if (confirmText && !window.confirm(confirmText)) return;

    setLoading(action);
    try {
      if (action === "delete") {
        await axios.delete(`/api/admin/users/${userId}`);
        toast.success("Utilisateur supprimé.");
      } else {
        await axios.post(`/api/admin/users/${userId}/${action}`);
        toast.success("Action effectuée.");
      }
      router.refresh();
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && typeof error.response?.data === "string"
          ? error.response.data
          : "Une erreur est survenue.";
      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  if (isDeleted) {
    return (
      <div className="text-sm text-gray-500 italic">
        Compte supprimé — plus aucune action possible.
      </div>
    );
  }

  if (cannotAct) {
    return (
      <div className="text-sm text-gray-500 italic">
        {isSelf && "Vous ne pouvez pas effectuer d'actions sur votre propre compte."}
        {isProtected && !isSelf && "Cet utilisateur est protégé par ADMIN_EMAILS."}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() =>
          handle(
            "ban",
            isBanned ? undefined : "Êtes-vous sûr de vouloir bannir cet utilisateur ?"
          )
        }
        disabled={loading !== null}
        className="px-4 py-2 text-sm font-medium rounded-md border border-orange-300 text-orange-700 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading === "ban"
          ? "..."
          : isBanned
          ? "Débannir"
          : "Bannir"}
      </button>

      <button
        onClick={() =>
          handle(
            "role",
            isAdmin
              ? "Retirer les droits admin à cet utilisateur ?"
              : "Promouvoir cet utilisateur comme administrateur ?"
          )
        }
        disabled={loading !== null}
        className="px-4 py-2 text-sm font-medium rounded-md border border-[#C9A84C] text-[#9A6F14] hover:bg-[#C9A84C]/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading === "role"
          ? "..."
          : isAdmin
          ? "Démettre admin"
          : "Promouvoir admin"}
      </button>

      <button
        onClick={() =>
          handle(
            "delete",
            "Êtes-vous sûr ? Cette action anonymise l'utilisateur et supprime ses méthodes de connexion. Irréversible."
          )
        }
        disabled={loading !== null}
        className="px-4 py-2 text-sm font-medium rounded-md border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading === "delete" ? "..." : "Supprimer"}
      </button>
    </div>
  );
};

export default AdminUserActions;