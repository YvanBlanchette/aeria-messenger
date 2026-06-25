"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";

import { pusherClient } from "@/app/libs/pusher";
import usePageVisibility from "./use-page-visibility";
import useConversation from "./use-conversation";
import type { FullMessageType } from "@/app/types";

const ORIGINAL_TITLE = "Aeria Messenger";

const useNotifications = () => {
	const session = useSession();
	const isVisible = usePageVisibility();
	const { conversationId: activeConversationId } = useConversation();

	const [unreadCount, setUnreadCount] = useState(0);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const pusherKey = useMemo(() => session?.data?.user?.email, [session?.data?.user?.email]);

	// Prepare the audio element once
	useEffect(() => {
		if (typeof window === "undefined") return;
		audioRef.current = new Audio("/sounds/notification.mp3");
		audioRef.current.volume = 0.5;
	}, []);

	// Ask for system notification permission once
	useEffect(() => {
		if (typeof window === "undefined") return;
		if (!("Notification" in window)) return;
		if (Notification.permission === "default") {
			// Small delay so it doesn't fire instantly on page load
			const t = setTimeout(() => {
				Notification.requestPermission().catch(() => {
					// user dismissed — nothing to do
				});
			}, 2000);
			return () => clearTimeout(t);
		}
	}, []);

	// Reset unread count when the tab becomes active
	useEffect(() => {
		if (isVisible) setUnreadCount(0);
	}, [isVisible]);

	// Maintain the tab title with unread count
	useEffect(() => {
		if (typeof document === "undefined") return;
		document.title = unreadCount > 0 ? `(${unreadCount}) ${ORIGINAL_TITLE}` : ORIGINAL_TITLE;
	}, [unreadCount]);

	const notify = useCallback(
		(message: FullMessageType) => {
			// Don't notify for own messages
			if (message.sender.email === pusherKey) return;
			// Don't notify if user is currently looking at this conversation
			if (isVisible && message.conversationId === activeConversationId) return;

			// Play sound (some browsers block before user interaction — try/catch)
			audioRef.current?.play().catch(() => {});

			// Bump tab title counter
			setUnreadCount((n) => n + 1);

			// System notification (if permission granted and tab not visible)
			if (!isVisible && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
				const senderName = message.sender.name || "Nouveau message";
				const preview = message.body || (message.image ? "📷 Image" : "Nouveau message");

				const n = new Notification(senderName, {
					body: preview,
					icon: message.sender.image || "/images/logo.png",
					tag: message.conversationId, // collapse multiple notifs from same conv
				});

				n.onclick = () => {
					window.focus();
					window.location.href = `/conversations/${message.conversationId}`;
					n.close();
				};
			}
		},
		[pusherKey, isVisible, activeConversationId],
	);

	// Subscribe to the user's personal Pusher channel
	useEffect(() => {
		if (!pusherKey) return;

		pusherClient.subscribe(pusherKey);

		const conversationUpdateHandler = (data: { id: string; messages: FullMessageType[] }) => {
			const lastMessage = data.messages?.[data.messages.length - 1];
			if (lastMessage) notify(lastMessage);
		};

		pusherClient.bind("conversation:update", conversationUpdateHandler);

		return () => {
			pusherClient.unbind("conversation:update", conversationUpdateHandler);
			// We don't unsubscribe — conversation-list already manages that subscription
		};
	}, [pusherKey, notify]);
};

export default useNotifications;
