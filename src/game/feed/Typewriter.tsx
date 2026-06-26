import { useEffect, useRef, useState } from "react";

type TypewriterProps = {
    id: string | undefined;
    text: string | undefined;
    onAnimationComplete?: (id: string) => void;
};

export function Typewriter({ id, text, onAnimationComplete }: TypewriterProps) {
    const [displayedText, setDisplayedText] = useState('');
    const finishedRef = useRef(false);
    const indexRef = useRef(0);

    useEffect(() => {
        finishedRef.current = false;
        indexRef.current = 0;
        setDisplayedText('');
    }, [id]);

    useEffect(() => {
        if (finishedRef.current || !text || !id) {
            return;
        }

        if (indexRef.current >= text.length) {
            finishedRef.current = true;

            const timeout = setTimeout(() => {
                onAnimationComplete?.(id);
            }, 1000);

            return () => clearTimeout(timeout);
        }

        const timeout = setTimeout(() => {
            indexRef.current++;
            setDisplayedText(text.slice(0, indexRef.current));
        }, 40);

        return () => clearTimeout(timeout);
    }, [displayedText, text, id, onAnimationComplete]);

    if (!displayedText) {
        return;
    }

    const animatedDot = displayedText.length % 2 === 0 ? '.' : '';

    return (
        <div>
            <div>{displayedText}{animatedDot}</div>
        </div>
    );
}