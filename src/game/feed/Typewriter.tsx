import { useEffect, useState } from "react";

type TypewriterProps = {
    id: string;
    text: string | undefined;
    onAnimationComplete?: (id: string) => void;
};

export function Typewriter({ id, text, onAnimationComplete }: TypewriterProps) {
    const [animatedText, setAnimatedText] = useState('');

    useEffect(() => {
        if (!text || !text.startsWith(animatedText)) {
            setAnimatedText('');
            return;
        } else if (animatedText.length >= text.length) {
            return;
        }

        const timeoutId = setTimeout(() => {
            const nextAnimatedText = animatedText + text[animatedText.length];
            setAnimatedText(animatedText + text[animatedText.length]);
            if (nextAnimatedText.length === text.length) {
                onAnimationComplete?.(id);
            }
        }, 40);

        return () => {
            clearTimeout(timeoutId);
        };

    }, [text, id, animatedText]);

    if (!animatedText) {
        return (<div>No text</div>);
    }

    const animatedDot = animatedText.length % 2 === 0 ? '.' : '';

    return (
        <div>
            <div>{animatedText}{animatedDot}</div>
        </div>
    );
}