"use client";

import axios from "axios";
import { find } from "lodash";
import { useEffect, useMemo, useRef, useState } from "react";

import type { FullMessageType } from "@/app/types";
import useConversation from "@/app/hooks/use-conversation";
import MessageBox from "./message-box";
import TypingIndicator from "./typing-indicator";
import { pusherClient } from "@/app/libs/pusher";
import {
  computeMessageMeta,
  formatSeparatorDate,
} from "@/app/libs/message-grouping";

type BodyProps = {
  initialMessages: FullMessageType[];
};

const Body: React.FC<BodyProps> = ({ initialMessages }) => {
  const [messages, setMessages] = useState(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { conversationId } = useConversation();

  const meta = useMemo(() => computeMessageMeta(messages), [messages]);

  useEffect(() => {
    axios.post(`/api/conversations/${conversationId}/seen`);
  }, [conversationId]);

  useEffect(() => {
    pusherClient.subscribe(conversationId);
    bottomRef?.current?.scrollIntoView();

    const messageHandler = (message: FullMessageType) => {
      axios.post(`/api/conversations/${conversationId}/seen`);

      setMessages((current) => {
        if (find(current, { id: message.id })) return current;
        return [...current, message];
      });

      bottomRef?.current?.scrollIntoView();
    };

    const updateMessageHandler = (newMessage: FullMessageType) => {
      setMessages((current) =>
        current.map((currentMessage) => {
          if (currentMessage.id === newMessage.id) return newMessage;
          return currentMessage;
        })
      );
    };

    pusherClient.bind("messages:new", messageHandler);
    pusherClient.bind("message:update", updateMessageHandler);

    return () => {
      pusherClient.unsubscribe(conversationId);
      pusherClient.unbind("messages:new", messageHandler);
      pusherClient.unbind("message:update", updateMessageHandler);
    };
  }, [conversationId]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50">
      {messages.map((message, i) => {
        const m = meta[message.id];
        return (
          <div key={message.id}>
            {m?.showSeparator && (
              <div className="flex justify-center py-4">
                <span
                  className="text-xs text-gray-500"
                  suppressHydrationWarning
                >
                  {formatSeparatorDate(new Date(message.createdAt))}
                </span>
              </div>
            )}
            <MessageBox
              isLast={i === messages.length - 1}
              data={message}
              isFirstInGroup={m?.isFirstInGroup ?? true}
              isLastInGroup={m?.isLastInGroup ?? true}
            />
          </div>
        );
      })}
      <TypingIndicator conversationId={conversationId} />
      <div ref={bottomRef} className="pt-24" aria-hidden />
    </div>
  );
};

export default Body;