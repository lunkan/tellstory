/*import { useState } from "react";
import { Reply } from "../storyteller/types";
import { Feed } from "./Feed";
import { LocationManager } from "./LocationManager";

type DebugPanelProps = {
  reply: Reply | null;
};

export function DebugPanel({ reply }: DebugPanelProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!reply) {
      return null;
    }

    if (isOpen) {
        const locations = [
        ...(reply?.details.current ? [reply?.details.current] : []),
        ...(reply?.details.previous ? [reply?.details.previous] : []),
        ...(reply?.details.parent ? [reply?.details.parent] : []),
        ...(reply?.details.adjacent || []),
        ...(reply?.details.quadrants || []) 
        ];

        const metrics = [
        ...(reply?.metrics.adjacent ? reply?.metrics.adjacent : []),
        ...(reply?.metrics.quadrants ? reply?.metrics.quadrants : []),
        ];

        const locationProfiles = [
        ...(reply?.locationProfiles.current ? [reply?.locationProfiles.current] : []),
        ...(reply?.locationProfiles.previous ? [reply?.locationProfiles.previous] : []),
        ...(reply?.locationProfiles.parent ? [reply?.locationProfiles.parent] : []),
        ...(reply?.locationProfiles.adjacent || []),
        ...(reply?.locationProfiles.quadrants || []) 
        ];

        const locationManager = new LocationManager(reply?.details.current?.key, locations, metrics, locationProfiles);

        return (
            <div className="debug-panel">
                <button className="debug-panel--close-btn" onClick={() => setIsOpen(false)}>&#10006;</button>
                <Feed reply={reply} locationManager={locationManager}></Feed>
            </div>
        );
    }

    return (
        <button className="debug-panel--open-btn" onClick={() => setIsOpen(true)}>
            <svg viewBox="0 0 100 80" width="16" height="16" fill="currentColor" style={{display: 'block', paddingTop: '4px', paddingBottom: '4px'}}>
                <rect width="100" height="12" rx="6"></rect>
                <rect y="34" width="100" height="12" rx="6"></rect>
                <rect y="68" width="100" height="12" rx="6"></rect>
                </svg>
            </button>
    );
}
*/