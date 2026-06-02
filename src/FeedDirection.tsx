import { useState } from "react";
import { LocationDirectionDescription, QuadNodePoint } from "../storyteller/types";
import { LocationManager } from "./LocationManager";
import { LocationSummaryTable } from "./LocationSummaryTable";
import { FeedProfile } from "./FeedProfile";
import { capitalized } from "./utils";
import { LocationMetricsTable } from "./LocationMetricsTable";

type FeedDirectionProps = {
  directionDescription: LocationDirectionDescription | null;
  locationManager: LocationManager;
};

export function FeedDirection({ directionDescription, locationManager }: FeedDirectionProps) {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    function renderVector(vector: QuadNodePoint | undefined): any {
        if (!vector) {
            return (<span> - </span>);
        }

        return (
            <span>
                <span>x: {vector.x}</span>&nbsp;
                <span>y: {vector.y}</span>&nbsp;
                <span>z: {vector.z}</span>
            </span>
        );
    }

    const locationData = locationManager.getLocationById(directionDescription?.key);
    const locationMetric = locationManager.getLocationMetricById(directionDescription?.key);
    const locationProfile = locationManager.getLocationProfileById(directionDescription?.key);
    if (!directionDescription || !locationData || !locationProfile) {
        return (<div>No feed data</div>);
    }

    return (
        <div>
            <h4 className="feed-direction--heading">
                <span>{capitalized(locationManager.getDirectionName(directionDescription.key))}</span>&nbsp;
                <span>({capitalized(locationManager.getDirectionKey(directionDescription.key))})</span>
            </h4>
            <p className="id-label">
                <strong>Vector:&nbsp;</strong>{renderVector(locationManager.getVector(directionDescription.key))}<br />
                <strong>ID:&nbsp;</strong>{directionDescription.key}
            </p>
            <p>{directionDescription.description}</p>
            <div>
                <div>
                    <button className="feed-direction--show-detail-btn" onClick={() => setIsDetailsOpen(!isDetailsOpen)}>Show details</button>
                </div>
                { isDetailsOpen && (
                <div className="feed-direction--details-box">
                    <FeedProfile title="Profile" profile={locationProfile}></FeedProfile>
                    <LocationSummaryTable title="Data" locations={[locationData]}></LocationSummaryTable>
                    <LocationMetricsTable title="Metrics" metric={locationMetric}></LocationMetricsTable>
                </div>
                )}
            </div>
        </div>
    );
}