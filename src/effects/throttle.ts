import { useRef } from "react";

type AnyFunction = (...args: any[]) => void;

// Custom hook for throttling
export function useThrottle<T extends AnyFunction>(callback: T, delay: number): (...args: Parameters<T>) => void {
    const isThrottled = useRef<boolean>(false);

    return (...args: Parameters<T>) => {
        if (isThrottled.current) return;

        callback(...args);
        isThrottled.current = true;

        setTimeout(() => {
            isThrottled.current = false;
        }, delay);
    };
}