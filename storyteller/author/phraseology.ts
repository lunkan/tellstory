
export function getFrequencyPhrase(frequency: number): string {
    if (frequency > 10) {
        return 'routinely';
    } else if (frequency > 5) {
        return 'many times';
    } else if (frequency > 2) {
        return 'some times';
    } else if (frequency === 2) {
        return 'a couple of times';
    } else if (frequency === 1) {
        return 'once before';
    } else {
        return 'first time';
    }
}

export function getRecencyPhrase(elapsedTime: number): string {
    if (elapsedTime > 100) {
        return 'long time ago';
    } else if (elapsedTime > 50) {
        return 'some time ago';
    } else if (elapsedTime > 25) {
        return 'recently';
    } else if (elapsedTime > 5) {
        return 'most recently';
    } else if (elapsedTime > 0) {
        return 'a moment ago';
    } else {
        return 'never before';
    }
}
