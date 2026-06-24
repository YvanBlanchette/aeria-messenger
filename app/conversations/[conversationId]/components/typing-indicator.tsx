"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import { pusherClient } from "@/app/libs/pusher";

type TypingUser = {
  email: string;
  name: string;
  lastSeen: number;
};

const TYPING_TIMEOUT = 3000;

type Props = {
  conversationId: string;
};

const TypingIndicator: React.FC<Props> = ({ conversationId }) => {
  const session = useSession();
  const currentUserEmail = session?.data?.user?.email;
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    const handler = (data: { userEmail: string; name: string }) => {
      if (data.userEmail === currentUserEmail) return;

      setTypingUsers((current) => {
        const filtered = current.filter((u) => u.email !== data.userEmail);
        return [
          ...filtered,
          {
            email: data.userEmail,
            name: data.name,
            lastSeen: Date.now(),
          },
        ];
      });
    };

    pusherClient.bind("typing", handler);

    const interval = setInterval(() => {
      setTypingUsers((current) =>
        current.filter((u) => Date.now() - u.lastSeen < TYPING_TIMEOUT)
      );
    }, 1000);

    return () => {
      pusherClient.unbind("typing", handler);
      clearInterval(interval);
    };
  }, [conversationId, currentUserEmail]);

  if (typingUsers.length === 0) return null;

  const text =
    typingUsers.length === 1
      ? `${typingUsers[0].name} est en train d'écrire`
      : typingUsers.length === 2
      ? `${typingUsers[0].name} et ${typingUsers[1].name} sont en train d'écrire`
      : "Plusieurs personnes sont en train d'écrire";

  return (
    <div className="px-4 py-2 text-xs text-gray-500 italic flex items-center gap-2">
      <span>{text}</span>
      <span className="inline-flex gap-0.5">
        <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
        <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
        <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
      </span>
    </div>
  );
};

export default TypingIndicator;