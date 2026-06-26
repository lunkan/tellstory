import { useRef } from "react";
import { useSnapScrollToBottom } from "../../effects/snapScrollToBottom";

type DescriptionFeedTextProps = {
    label?: string;
    children?: React.ReactNode;
};

function PendingText() {
    return (
        <svg fill="#333" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: '14px', height: '14px' }}>
            <circle cx="4" cy="12" r="3">
                <animate id="spinner_qFRN" begin="0;spinner_OcgL.end+0.25s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33" />
            </circle>
            <circle cx="12" cy="12" r="3"><animate begin="spinner_qFRN.begin+0.1s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33" /></circle>
            <circle cx="20" cy="12" r="3"><animate id="spinner_OcgL" begin="spinner_qFRN.begin+0.2s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33" /></circle>
        </svg>
    );
}

export function DescriptionFeedText({ label, children }: DescriptionFeedTextProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useSnapScrollToBottom(scrollContainerRef, bottomRef);

    return (
        <div className="feed" ref={scrollContainerRef}>
            <div className="feed--shade"></div>
            <div>
                <h2 className="feed--heading">{label ? label : ''}</h2>
                {children || PendingText()}
            </div>
            <div ref={bottomRef}></div>
        </div>
    );
}
