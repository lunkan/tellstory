/*import { Reply } from "../storyteller/types";
import { FeedDetailPanel } from "./FeedDetailPanel";
import { FeedDirection } from "./FeedDirection";
import { FeedProfile } from "./FeedProfile";
import { LocationManager } from "./LocationManager";
import { LocationSummaryTable } from "./LocationSummaryTable";
import { useLocationStore } from "./store/locationStore";

type GeneralInfoProps = {
  reply: Reply | null;
  locationManager: LocationManager;
};

useLocationStore.subscribe((state) => {
  console.log("store updated", state.messageQueue.length);
});

export function Feed({ reply, locationManager }: GeneralInfoProps) {
    const messages = useLocationStore((state) => state.messageQueue);
    console.log('messgaes', messages.length, messages);

    if (!reply) {
        return (<div>No feed data</div>);
    }

    const currentLocationData = locationManager.getLocationById(reply.details.current?.key);
    const currentLocationProfile = locationManager.getLocationProfileById(reply.locationProfiles.current?.key);

    const previousLocationData = locationManager.getLocationById(reply.details.previous?.key);
    const previousLocationProfile = locationManager.getLocationProfileById(reply.locationProfiles.previous?.key);

    if (!currentLocationData || !currentLocationProfile || !previousLocationData || !previousLocationProfile) {
        return (<div>No feed data</div>);
    }

    return (
        <div>
            <h2>SCENE TRANSITION</h2>
            <p>{reply.sceneTransition}</p>
            <h2>QUADRANT SUMMARY</h2>
            <p>{reply.quadrantSummary}</p>
            <h2>ADJACENT SUMMARY</h2>
            <p>{reply.adjacentSummary}</p>
            <FeedDetailPanel>
                <h3>Current location</h3>
                <FeedProfile title="Profile" profile={currentLocationProfile}></FeedProfile>
                <LocationSummaryTable title="Data" locations={[currentLocationData]}></LocationSummaryTable>
                <h3>Previous location</h3>
                <FeedProfile title="Profile" profile={previousLocationProfile}></FeedProfile>
                <LocationSummaryTable title="Data" locations={[previousLocationData]}></LocationSummaryTable>
            </FeedDetailPanel>

            <h3 className="feed--section-heading">ADJACENT</h3>
            {reply.adjacent.map((adjacentNode, i) => 
                <FeedDirection key={i} directionDescription={adjacentNode} locationManager={locationManager}></FeedDirection>
            )}
            <h3 className="feed--section-heading">PREMISES</h3>
            {reply.premises.map((premise, i) => 
                <FeedDirection key={i} directionDescription={premise} locationManager={locationManager}></FeedDirection>
            )}
        </div>
    );
}*/