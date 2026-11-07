export type PathStep<State> = {
    state: State;
    cost: number;
};

export type ShortestPathOptions<State> = {
    start: State;
    /** Keys must uniquely identify all state that affects future steps. */
    key: (state: State) => string;
    isGoal: (state: State) => boolean;
    /** The reachable state space must be finite. Costs must be finite and non-negative. */
    neighbours: (state: State) => readonly PathStep<State>[];
};

export type ShortestPath<State> = {
    states: State[];
    cost: number;
};

export type ShortestPathsOptions<State> = Omit<ShortestPathOptions<State>, 'isGoal'> & {
    /** Return a goal ID for states of interest, or undefined for non-goal states. */
    goal: (state: State) => string | undefined;
    goalCount: number;
};

type Entry<State> = {
    key: string;
    state: State;
    cost: number;
};

function compareEntries<State>(a: Entry<State>, b: Entry<State>): number {
    return a.cost - b.cost || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
}

class MinQueue<State> {
    private readonly entries: Entry<State>[] = [];

    public push(entry: Entry<State>): void {
        let index = this.entries.length;
        this.entries.push(entry);
        while (index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if (compareEntries(this.entries[parent], entry) <= 0) {
                break;
            }
            this.entries[index] = this.entries[parent];
            index = parent;
        }
        this.entries[index] = entry;
    }

    public pop(): Entry<State> | undefined {
        const first = this.entries[0];
        const last = this.entries.pop();
        if (!first || !last || !this.entries.length) {
            return first;
        }

        let index = 0;
        while (true) {
            const left = index * 2 + 1;
            if (left >= this.entries.length) {
                break;
            }
            const right = left + 1;
            const child = right < this.entries.length && compareEntries(this.entries[right], this.entries[left]) < 0
                ? right : left;
            if (compareEntries(last, this.entries[child]) <= 0) {
                break;
            }
            this.entries[index] = this.entries[child];
            index = child;
        }
        this.entries[index] = last;
        return first;
    }
}

/**
 * Dijkstra search over a finite state graph. Equal-cost choices are settled by state key,
 * independent of the order in which neighbours are supplied.
 */
export function findShortestPath<State>(options: ShortestPathOptions<State>): ShortestPath<State> | undefined {
    return findShortestPaths({
        ...options,
        goal: (state) => options.isGoal(state) ? 'goal' : undefined,
        goalCount: 1,
    }).get('goal');
}

/** Find the cheapest state for each distinct goal ID using a single search. */
export function findShortestPaths<State>(options: ShortestPathsOptions<State>): Map<string, ShortestPath<State>> {
    if (!Number.isSafeInteger(options.goalCount) || options.goalCount < 0) {
        throw new Error('Goal count must be a non-negative safe integer');
    }
    const results = new Map<string, ShortestPath<State>>();
    if (!options.goalCount) {
        return results;
    }
    const startKey = options.key(options.start);
    const queue = new MinQueue<State>();
    const best = new Map<string, number>([[startKey, 0]]);
    const states = new Map<string, State>([[startKey, options.start]]);
    const previous = new Map<string, string>();
    queue.push({ key: startKey, state: options.start, cost: 0 });

    let current: Entry<State> | undefined;
    while ((current = queue.pop())) {
        if (current.cost !== best.get(current.key)) {
            continue;
        }

        const goal = options.goal(current.state);
        if (goal !== undefined && !results.has(goal)) {
            const path: State[] = [];
            let key: string | undefined = current.key;
            while (key !== undefined) {
                path.push(states.get(key)!);
                key = previous.get(key);
            }
            results.set(goal, { states: path.reverse(), cost: current.cost });
            if (results.size === options.goalCount) {
                return results;
            }
        }

        for (const step of options.neighbours(current.state)) {
            if (!Number.isFinite(step.cost) || step.cost < 0) {
                throw new Error('Path step cost must be finite and non-negative');
            }
            const cost = current.cost + step.cost;
            if (!Number.isFinite(cost)) {
                throw new Error('Path cost exceeds the finite number range');
            }
            const key = options.key(step.state);
            if (cost >= (best.get(key) ?? Infinity)) {
                continue;
            }
            best.set(key, cost);
            states.set(key, step.state);
            previous.set(key, current.key);
            queue.push({ key, state: step.state, cost });
        }
    }
    return results;
}
