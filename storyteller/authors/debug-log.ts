export type LogEntry = {
    instructions: string;
    responseType: 'text' | 'json';
    response: string | object;
    timestamp: number;
    type: string;
};

type LogQueryOptions = {
    types?: string[],
    startTime?: number,
    endTime?: number,
};

export class DebugLog {
    private _log: LogEntry[] = [];

    public add(logEntry: LogEntry): void {
        this._log.push(logEntry);
    }

    public query(options: LogQueryOptions = {}): LogEntry[] {
        return this._log.filter((entry) => {
            if (Array.isArray(options.types) && !options.types.includes(entry.type)) {
                return false;
            } else if (options.startTime && options.startTime > entry.timestamp) {
                return false;
            } else if (options.endTime && entry.timestamp > options.endTime) {
                return false;
            }

            return true;
        })
    }
}