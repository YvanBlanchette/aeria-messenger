"use client";

import clsx from "clsx";
import { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useSession } from "next-auth/react";

import type { FullMessageType } from "@/app/types";
import Avatar from "@/app/components/avatar";
import ImageModal from "./image-modal";
import YouTubeEmbed from "./youtube-embed";
import { getYouTubeIdIfOnlyUrl } from "@/app/libs/youtube";

type MessageBoxProps = {
  data: FullMessageType;
  isLast?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
};

const URL_REGEX =
  /\b((?:https?:\/\/|www\.)[^\s<>()]+|[a-zA-Z0-9][a-zA-Z0-9-]*\.(?:com|net|org|io|dev|app|ca|co|uk|fr|de|ai|me|tv|gg|xyz|info|biz|edu|gov|us|eu|store|shop|tech|news|tools|page|site|online|cloud|so|sh|to|ly|be|tv)(?:\/[^\s<>()]*)?)/gi;

function renderWithLinks(text: string): React.ReactNode {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) => {
    if (!part) return null;
    const isUrl =
      /^https?:\/\//i.test(part) ||
      /^www\./i.test(part) ||
      /^[a-zA-Z0-9][a-zA-Z0-9-]*\.(?:com|net|org|io|dev|app|ca|co|uk|fr|de|ai|me|tv|gg|xyz|info|biz|edu|gov|us|eu|store|shop|tech|news|tools|page|site|online|cloud|so|sh|to|ly|be|tv)(?:\/|$)/i.test(
        part
      );

    if (isUrl) {
      const href = /^https?:\/\//i.test(part) ? part : `https://${part}`;
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline break-all hover:opacity-80"
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

const MessageBox: React.FC<MessageBoxProps> = ({
  data,
  isLast,
  isFirstInGroup = true,
  isLastInGroup = true,
}) => {
  const session = useSession();
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const isOwn = session?.data?.user?.email === data?.sender?.email;
  const seenList = (data.seen || [])
    .filter((user) => user.email !== data?.sender?.email)
    .map((user) => user.name)
    .join(", ");

  const youtubeId =
    !data.image && data.body ? getYouTubeIdIfOnlyUrl(data.body) : null;
  const isYouTubeOnly = youtubeId !== null;
  const isRich = !!data.image || isYouTubeOnly;

  // Tight vertical spacing between grouped messages; normal padding otherwise.
  const container = clsx(
    "flex gap-3 px-4",
    isFirstInGroup ? "pt-4" : "pt-0.5",
    isLastInGroup ? "pb-0" : "pb-0",
    isOwn && "justify-end"
  );

  const avatarWrap = clsx(
    isOwn && "order-2",
    !isFirstInGroup && "invisible"
  );

  const body = clsx("flex flex-col gap-1", isOwn && "items-end");

  const message = clsx(
    "text-sm w-fit overflow-hidden shadow",
    isOwn ? "bg-[#C9A84C] text-white" : "bg-white text-gray-900",
    isRich ? "rounded-md p-0" : "rounded-full py-3 px-4 break-words"
  );

  return (
    <div className={container}>
      <div className={avatarWrap} aria-hidden={!isFirstInGroup}>
        <Avatar user={data.sender} />
      </div>

      <div className={body}>
        {isFirstInGroup && (
          <div className="flex items-center gap-1">
            <p className="text-sm text-gray-500">{data.sender.name}</p>
            <time
              dateTime={new Date(data.createdAt).toISOString()}
              className="text-xs text-gray-400"
              suppressHydrationWarning
            >
              {format(new Date(data.createdAt), "HH:mm", { locale: fr })}
            </time>
          </div>
        )}

        <div className={message}>
          {data.image ? (
            <>
              <ImageModal
                src={data.image}
                isOpen={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
              />
              <button
                onClick={() => setImageModalOpen(true)}
                className="cursor-pointer focus:outline-[#C9A84C]"
              >
                <Image
                  src={data.image}
                  alt="image"
                  height={288}
                  width={288}
                  className="object-cover hover:scale-110 transition translate"
                />
              </button>
            </>
          ) : isYouTubeOnly && youtubeId ? (
            <YouTubeEmbed videoId={youtubeId} />
          ) : (
            <p>{renderWithLinks(data.body || "")}</p>
          )}
        </div>

        {isLast && isOwn && seenList.length > 0 && (
          <span className="text-xs font-light text-gray-500">
            {`Vu par ${seenList}`}
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageBox;