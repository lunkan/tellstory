import { LocationProfile, Reply } from "../storyteller/types";
import { LocationManager } from "./LocationManager";
import { capitalized } from "./utils";

type LocationProfilesProps = {
  reply: Reply | null;
  locationManager: LocationManager;
};

export function LocationProfiles({ reply, locationManager }: LocationProfilesProps) {
    if (!reply) {
        return (<div>No location details</div>);
    }

    function renderLocationProfile(title: string, locations: LocationProfile[]): any {
        return (
            <>
                <h4>{title}</h4>
                {locations.map((location, i) =>
                    <div key={i}>
                        <h5>
                            <span>{capitalized(locationManager.getDirectionName(location.key))}</span>&nbsp;
                            <span>({capitalized(locationManager.getDirectionKey(location.key))})</span>
                        </h5>
                        <p className="id-label"><strong>ID:&nbsp;</strong>{location.key}</p>
                        <p>{location.description}</p>
                    </div>
                )}
            </>
        );
    }

    return (
        <div>
            <h2>LOCATION PROFILES</h2>
            {reply.locationProfiles.current ? renderLocationProfile('Current', [reply.locationProfiles.current]) : ' - '}
            {reply.locationProfiles.previous ? renderLocationProfile('Previous', [reply.locationProfiles.previous]) : ' - '}
            {reply.locationProfiles.parent ? renderLocationProfile('Parent', [reply.locationProfiles.parent]) : ' - '}
            {reply.locationProfiles.adjacent ? renderLocationProfile('Adjacent', reply.locationProfiles.adjacent) : ' - '}
            {reply.locationProfiles.quadrants ? renderLocationProfile('Quadrants', reply.locationProfiles.quadrants) : ' - '}
        </div>
    );
}