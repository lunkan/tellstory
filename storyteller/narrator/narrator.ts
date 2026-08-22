import dotenv from "dotenv";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

dotenv.config();

const apiKey: string | undefined = process.env.ELEVENLABS_API_KEY;

console.log('VOICE LOADED', apiKey);

if (!apiKey) {
    throw new Error("Please set ELEVENLABS_API_KEY in your .env file.");
}

export function getKey(): string {
    return apiKey || '';
}

export class Narrator {
    private _client: ElevenLabsClient;

    constructor() {
        this._client = new ElevenLabsClient({
            apiKey: process.env.ELEVENLABS_API_KEY,
        });
    }

    public async speak(text: string): Promise<Buffer> {
        console.log('speak', text);
        const audioStream = await this._client.textToSpeech.stream("JBFqnCBsd6RMkjVDRZzb", {
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
