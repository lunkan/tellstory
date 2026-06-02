import React from "react";
import { QuadNodeData, Reply } from "../storyteller/types";

type LocationDataProps = {
  reply: Reply | null;
};

export function LocationData({ reply }: LocationDataProps) {
    if (!reply) {
        return (<div>No location data</div>);
    }

    function renderLocationData(title: string, locations: QuadNodeData[]): any {
        return (
            <>
                <h4>{title}</h4>
                <table className="location-data--table">
                    <tbody>
                    <tr>
                        <th>Depth</th>
                        <th>Bounds</th>
                        <th>Terrain</th>
                    </tr>
                    {locations.map((location, i) => 
                        <React.Fragment key={i}>
                            <tr>
                                <th colSpan={3} className="location-data--table-ribbon">ID: {location.key}</th>
                            </tr>
                            <tr>
                                <td>{location.depth}</td>
                                <td>
                                    <table className="location-data--inner-table">
                                        <tbody>
                                            <tr>
                                                <th>x</th>
                                                <td>{location.bounds.x}</td>
                                            </tr>
                                            <tr>
                                                <th>y</th>
                                                <td>{location.bounds.y}</td>
                                            </tr>
                                            <tr>
                                                <th>size</th>
                                                <td>{location.bounds.size}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                                <td>
                                    <table className="location-data--inner-table">
                                        <tbody>
                                            <tr>
                                                <th>Elevation</th>
                                                <td>{location.tile?.elevation}</td>
                                            </tr>
                                            <tr>
                                                <th>Terrain</th>
                                                <td>{location.tile?.type}</td>
                                            </tr>
                                            <tr>
                                                <th>Value</th>
                                                <td>{location.tile?.value}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </React.Fragment>
                    )}
                    </tbody>
                </table>
            </>
        );
    }

    return (
        <div>
            <h2>DATA</h2>
            {reply.details.current ? renderLocationData('Current', [reply.details.current]) : ' - '}
            {reply.details.previous ? renderLocationData('Previous', [reply.details.previous]) : ' - '}
            {reply.details.parent ? renderLocationData('Parent', [reply.details.parent]) : ' - '}
            {reply.details.adjacent ? renderLocationData('Adjacent', reply.details.adjacent) : ' - '}
            {reply.details.quadrants ? renderLocationData('Quadrants', reply.details.quadrants) : ' - '}
        </div>
    );
}