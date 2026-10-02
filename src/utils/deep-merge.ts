type DeepMergeOptions = {
    mergeArraysById?: boolean;
};

export function deepMerge<T>(
    target: T,
    source: Partial<T>,
    options: DeepMergeOptions = {}
): T {
    return merge(target, source, options) as T;
}

function merge(
    target: unknown,
    source: unknown,
    options: DeepMergeOptions
): unknown {
    if (Array.isArray(target) && Array.isArray(source)) {
        if (
            options.mergeArraysById &&
            areObjectsWithId(target) &&
            areObjectsWithId(source)
        ) {
            return mergeArraysById(target, source, options);
        }

        return source;
    }

    if (isPlainObject(target) && isPlainObject(source)) {
        const result: Record<string, unknown> = { ...target };

        for (const key of Object.keys(source)) {
            const sourceValue = source[key];
            const targetValue = result[key];

            result[key] =
                targetValue !== undefined
                    ? merge(targetValue, sourceValue, options)
                    : sourceValue;
        }

        return result;
    }

    return source;
}

function mergeArraysById(
    target: Array<{ id: string | number }>,
    source: Array<{ id: string | number }>,
    options: DeepMergeOptions
) {
    const result = [...target];

    for (const sourceItem of source) {
        const index = result.findIndex(
            targetItem => targetItem.id === sourceItem.id
        );

        if (index === -1) {
            result.push(sourceItem);
        } else {
            result[index] = merge(
                result[index],
                sourceItem,
                options
            ) as { id: string | number };
        }
    }

    return result;
}

// An empty array qualifies: under mergeArraysById an empty source means
// "no updates", so it has to merge to the target unchanged rather than
// falling through to the replace-wholesale branch and clearing it.
function areObjectsWithId(
    value: unknown[]
): value is Array<{ id: string | number }> {
    return value.every(
        item =>
            isPlainObject(item) &&
            ("id" in item) &&
            (typeof item.id === "string" ||
                typeof item.id === "number")
    );
}

function isPlainObject(
    value: unknown
): value is Record<string, any> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}
