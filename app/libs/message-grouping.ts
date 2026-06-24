import { differenceInMinutes, differenceInHours, isSameDay, isToday, isYesterday, isThisWeek, format } from "date-fns";
import { fr } from "date-fns/locale";

const GROUP_THRESHOLD_MINUTES = 5;
const SEPARATOR_THRESHOLD_HOURS = 1;

export type MessageMeta = {
	isFirstInGroup: boolean;
	isLastInGroup: boolean;
	showSeparator: boolean;
};

type MinimalMessage = {
	id: string;
	createdAt: Date | string;
	sender: { email: string | null };
};

export function computeMessageMeta(messages: MinimalMessage[]): Record<string, MessageMeta> {
	const meta: Record<string, MessageMeta> = {};

	messages.forEach((message, i) => {
		const prev = i > 0 ? messages[i - 1] : null;
		const next = i < messages.length - 1 ? messages[i + 1] : null;

		const currentDate = new Date(message.createdAt);
		const prevDate = prev ? new Date(prev.createdAt) : null;
		const nextDate = next ? new Date(next.createdAt) : null;

		const sameSenderAsPrev = prev !== null && prev.sender.email === message.sender.email;
		const sameSenderAsNext = next !== null && next.sender.email === message.sender.email;

		const closeToPrev = prevDate !== null && differenceInMinutes(currentDate, prevDate) < GROUP_THRESHOLD_MINUTES;
		const closeToNext = nextDate !== null && differenceInMinutes(nextDate, currentDate) < GROUP_THRESHOLD_MINUTES;

		const isFirstInGroup = !sameSenderAsPrev || !closeToPrev;
		const isLastInGroup = !sameSenderAsNext || !closeToNext;

		const showSeparator = prevDate === null || !isSameDay(currentDate, prevDate) || differenceInHours(currentDate, prevDate) >= SEPARATOR_THRESHOLD_HOURS;

		meta[message.id] = {
			isFirstInGroup,
			isLastInGroup,
			showSeparator,
		};
	});

	return meta;
}

export function formatSeparatorDate(date: Date): string {
	if (isToday(date)) {
		return `Aujourd'hui à ${format(date, "HH:mm")}`;
	}
	if (isYesterday(date)) {
		return `Hier à ${format(date, "HH:mm")}`;
	}
	if (isThisWeek(date, { locale: fr, weekStartsOn: 1 })) {
		return format(date, "EEEE 'à' HH:mm", { locale: fr });
	}
	return format(date, "d MMMM yyyy 'à' HH:mm", { locale: fr });
}
