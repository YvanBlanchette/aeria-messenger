"use client";

import axios from "axios";
import clsx from "clsx";
import { useState } from "react";
import { useSession } from "next-auth/react";

import type { ReactionWithUser } from "@/app/types";

const QUICK_REACTIONS = ["❤️", "😆", "😮", "😢", "😡", "👍"];

type Props = {
  messageId: string;
  reactions: ReactionWithUser[];
  isOwn: boolean;
};

const MessageReactions: React.FC<Props> = ({ messageId, reactions, isOwn }) => {
  const session = useSession();
  const currentUserEmail = session?.data?.user?.email;
  const [pickerOpen, setPickerOpen] = useState(false);

  // Group reactions by emoji
  const grouped = reactions.reduce<Record<string, { count: number; userReacted: boolean; users: string[] }>>(
    (acc, r) => {
      const entry = acc[r.emoji] ?? { count: 0, userReacted: false, users: [] };
      entry.count += 1;
      entry.users.push(r.user.name || "Anonyme");
      if (r.user.email === currentUserEmail) entry.userReacted = true;
      acc[r.emoji] = entry;
      return acc;
    },
    {}
  );

  const toggleReaction = async (emoji: string) => {
    setPickerOpen(false);
    try {
      await axios.post(`/api/messages/${messageId}/react`, { emoji });
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
    }
  };

  const entries = Object.entries(grouped);
  const hasReactions = entries.length > 0;

  return (
    <div
      className={clsx(
        "flex items-center gap-1 mt-1 relative",
        isOwn && "justify-end"
      )}
    >
      {hasReactions &&
        entries.map(([emoji, info]) => (
          <button
            key={emoji}
            onClick={() => toggleReaction(emoji)}
            title={info.users.join(", ")}
            className={clsx(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition cursor-pointer",
              info.userReacted
                ? "bg-[#C9A84C]/10 border-[#C9A84C] text-[#9A6F14]"
                : "bg-white border-gray-200 hover:border-gray-300"
            )}
          >
            <span>{emoji}</span>
            <span className="text-gray-600">{info.count}</span>
          </button>
        ))}

      <div className="relative">
        <button
          onClick={() => setPickerOpen((v) => !v)}
          className={clsx(
            "rounded-full text-xs w-6 h-6 flex items-center justify-center transition cursor-pointer",
            "bg-white border border-gray-200 hover:border-gray-400 text-gray-500",
            !hasReactions && "opacity-0 group-hover:opacity-100"
          )}
          aria-label="Ajouter une réaction"
        >
          +
        </button>

        {pickerOpen && (
          <>
            {/* click-outside catcher */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setPickerOpen(false)}
            />
            <div
              className={clsx(
                "absolute z-20 bottom-full mb-2 flex gap-1 bg-white border border-gray-200 rounded-full px-2 py-1 shadow-lg",
                isOwn ? "right-0" : "left-0"
              )}
            >
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(emoji)}
                  className="text-lg hover:scale-125 transition-transform cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageReactions;