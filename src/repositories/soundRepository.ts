async function narrate(text: string, abortSignal: AbortSignal): Promise<Blob> {
    console.log('handleSound');
    const res = await fetch("/sound/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: abortSignal,
    });

    return res.blob();

    //res.send(audioBuffer);

    /*const data: any = await res.json();
    if (!res.ok) {
        throw new Error(data.error ?? 'New game Request failed');
    }*/
}

export const soundRepository = {
    narrate,
};
