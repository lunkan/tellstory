async function config(configSettings: { [key: string]: unknown }): Promise<boolean> {
    const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configSettings),
    });

    const data: any = await res.json();
    if (!res.ok) {
        throw new Error(data.error ?? 'New game Request failed');
    }

    return true;
}

async function clearStorage(storageType: string): Promise<boolean> {
    const res = await fetch("/api/admin/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: storageType }),
    });

    const data: any = await res.json();
    if (!res.ok) {
        throw new Error(data.error ?? 'New game Request failed');
    }

    return true;
}

export const adminRepository = {
    config,
    clearStorage,
};
