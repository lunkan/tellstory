import { ReactNode, useState } from "react";

type FeedDetailPanelProps = {
  children: ReactNode[] | null;
};

export function FeedDetailPanel({ children }: FeedDetailPanelProps) {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    return (
        <div>
            <div>
                <button className="feed-direction--show-detail-btn" onClick={() => setIsDetailsOpen(!isDetailsOpen)}>Show details</button>
            </div>
            { isDetailsOpen && (<div className="feed-direction--details-box">{children}</div>)}
        </div>
    );
}