"use client";

import { useEffect, useState } from "react";

/**
 * Tracks whether the current browser tab is visible/active.
 * Returns true when the user is looking at the tab, false when
 * the tab is in the background or the window is minimized.
 */
const usePageVisibility = (): boolean => {
	const [isVisible, setIsVisible] = useState<boolean>(typeof document !== "undefined" ? document.visibilityState === "visible" : true);

	useEffect(() => {
		const handler = () => {
			setIsVisible(document.visibilityState === "visible");
		};

		document.addEventListener("visibilitychange", handler);
		return () => document.removeEventListener("visibilitychange", handler);
	}, []);

	return isVisible;
};

export default usePageVisibility;
