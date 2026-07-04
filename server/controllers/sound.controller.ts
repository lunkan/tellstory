
import type { Request, Response } from "express";
import { narrator } from "../../storyteller/narrator/narrator";

type NarrateRequest = { text: string };

export async function narrate(
    req: Request<unknown, unknown, NarrateRequest>,
    res: Response,
) {
    console.log('IM HERE ON SERVER NARRATOR');

    try {
        const { text } = req.body;
        console.log('Narrotor', text);

        const audioBuffer = await narrator.speak(text);
        //await generateSpeech(req.body.text);

        res.set({
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store"
        });

        res.send(audioBuffer);

        //const audioBuffer = await generateSpeech(req.body.text);
        //        res.send(audioBuffer);


        //res.json({ success: true });
    } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: message });
    }
}