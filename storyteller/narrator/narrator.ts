import dotenv from "dotenv";
// Type-only, so it is erased at compile time. The runtime import lives in
// _getClient() below: loading this SDK costs ~2s, which would otherwise be
// paid on every server start and every tsx watch restart.
import type { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

dotenv.config();

export function hasKey(): boolean {
    return Boolean(process.env.ELEVENLABS_API_KEY);
}

export class Narrator {
    private _client: Promise<ElevenLabsClient> | undefined;

    private _getClient(): Promise<ElevenLabsClient> {
        if (!this._client) {
            this._client = (async () => {
                const apiKey = process.env.ELEVENLABS_API_KEY;
                if (!apiKey) {
                    throw new Error("Please set ELEVENLABS_API_KEY in your .env file.");
                }

                const { ElevenLabsClient } = await import("@elevenlabs/elevenlabs-js");
                return new ElevenLabsClient({ apiKey });
            })();
        }

        return this._client;
    }

    public async speak(text: string): Promise<Buffer> {
        console.log('speak', text);
        const client = await this._getClient();
        const audioStream = await client.textToSpeech.stream("JBFqnCBsd6RMkjVDRZzb", {
            modelId: "eleven_v3",
            text,
            outputFormat: "mp3_44100_128",
            // Optional voice settings that allow you to customize the output
            /*voiceSettings: {
                stability: 0,
                similarityBoost: 1.0,
                useSpeakerBoost: true,
                speed: 1.0,
            },*/
        });

        const chunks: Uint8Array[] = []; // Buffer[] = [];
        for await (const chunk of audioStream) {
            chunks.push(chunk);
        }

        const content = Buffer.concat(chunks);
        return content;
    }
}

export const narrator = new Narrator();
