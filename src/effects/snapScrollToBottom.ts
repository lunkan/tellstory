import { RefObject, useEffect } from "react";

export function useSnapScrollToBottom(
    scrollContainerRef: RefObject<HTMLElement | null>,
    bottomRef: RefObject<HTMLElement | null>,
) {
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) {
                bottomRef.current?.scrollIntoView();
            }
        }, {
            root: scrollContainerRef.current,
            threshold: 0,
        });

        const bottom = bottomRef.current;
        if (bottom) observer.observe(bottom);

        return () => observer.disconnect();
    }, [scrollContainerRef, bottomRef]);
}
