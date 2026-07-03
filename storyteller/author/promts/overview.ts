//Describe the surrounding area at a larger scale.
//Focus on districts, forests, mountains, roads, rivers, coastlines, settlements, or other large features.
//Do not describe small nearby objects or the player's current pose.

export const SHARED_OVERVIEW_DESCRIPTION_PROMT: string =
    `You are a game writer.

Write a concise overview of the environment for an audio-based game.

Requirements:
- Use second-person perspective ("you").
- Write in natural Swedish.
- Maximum 40 words.
- Describe the surrounding area at a larger scale.
- Summarize the area rather than individual nearby objects.
- Use only information from "Description of current location". Never invent, infer, or embellish details.
- Output only the description text.`;