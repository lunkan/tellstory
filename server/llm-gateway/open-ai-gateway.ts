// Type-only, so the SDK is not pulled in at server startup.
import type OpenAI from "openai";

const DEFAULT_MODEL = "gpt-5.6-terra";

let client: Promise<OpenAI> | undefined;

function getClient(): Promise<OpenAI> {
    if (!client) {
        client = (async () => {
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) {
                throw new Error("Please set OPENAI_API_KEY in your .env file.");
            }

            const { default: OpenAI } = await import("openai");
            return new OpenAI({ apiKey });
        })();
    }

    return client;
}

export async function generateResponse(instructions: string, input: string | OpenAI.Responses.ResponseInput, text?: OpenAI.Responses.ResponseTextConfig, model: string = DEFAULT_MODEL): Promise<string> {
    const openAi = await getClient();
    const response = await openAi.responses.create({
        model,
        instructions,
        input,
        text,
    });

    return response.output_text;
}
