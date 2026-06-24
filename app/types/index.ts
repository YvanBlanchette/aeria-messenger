import type { Conversation, Message, Reaction, User } from "@prisma/client";

export type ReactionWithUser = Reaction & {
	user: User;
};

export type FullMessageType = Message & {
	sender: User;
	seen: User[];
	reactions: ReactionWithUser[];
};

export type FullConversationType = Conversation & {
	users: User[];
	messages: FullMessageType[];
};
