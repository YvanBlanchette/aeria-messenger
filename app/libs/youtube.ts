/**
 * Extracts a YouTube video ID from text *if* the entire trimmed text
 * consists of a single YouTube URL. Returns null otherwise.
 *
 * Supports youtube.com/watch?v=, youtu.be/, youtube.com/shorts/,
 * youtube.com/embed/, and the m.youtube.com mobile variant.
 */
export function getYouTubeIdIfOnlyUrl(text: string): string | null {
	const trimmed = text.trim();
	if (!trimmed || /\s/.test(trimmed)) return null;

	let url: URL;
	try {
		url = new URL(trimmed);
	} catch {
		return null;
	}

	const host = url.hostname.replace(/^www\.|^m\./, "");
	const idPattern = /^[a-zA-Z0-9_-]{11}$/;

	if (host === "youtu.be") {
		const id = url.pathname.slice(1).split("/")[0];
		return idPattern.test(id) ? id : null;
	}

	if (host === "youtube.com") {
		if (url.pathname === "/watch") {
			const id = url.searchParams.get("v");
			return id && idPattern.test(id) ? id : null;
		}
		const shortsMatch = url.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/);
		if (shortsMatch) return shortsMatch[1];
		const embedMatch = url.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{11})/);
		if (embedMatch) return embedMatch[1];
	}

	return null;
}
