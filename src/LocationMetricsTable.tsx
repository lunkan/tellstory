/*import { Metric } from "../storyteller/types";

type LocationMetricsTableProps = {
    title: string;
    metric: Metric | undefined;
};

export function LocationMetricsTable({ title, metric }: LocationMetricsTableProps) {
    if (!metric) {
        return (<div>No location data</div>);
    }

    return (
        <>
            <h4>{title}</h4>
            <table className="location-data--table">
                <tbody>
                {Object.entries(metric).map(([key, value], i) =>
                    <tr key={i}>
                        <th>{key}</th>
                        <td>{value}</td>
                    </tr>
                )}
                </tbody>
            </table>
        </>
    );
}*/