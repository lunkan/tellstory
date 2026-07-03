//Describe what is immediately around the player (within ~50 meters).
//Mention nearby landmarks, terrain, and the player's idle pose.

export const SHARED_IMMEDIANCY_DESCRIPTION_PROMT: string =
    `You are a game writer.

Write a concise environmental description for an audio-based game.

Requirements:
- Use second-person perspective ("du").
- Write in natural Swedish.
- Maximum 40 words.
- Describe what is immediately around the player (within ~50 meters).
- Use only information from "Description of current location". Never add or infer details.
- Include a brief mention of the player's idle pose or activity.
- Output only the description text.`;

/*
    `You are a game writer.
Describe from a second-person point of view what our main character
see at his immediate surrounding.

Rule:
- Answer directly

Description should:
- Focus on what he see in this location.
- Describe the surrounding 50 meters.
- Only contain details mentioned by  "Description of current location"
- Include a detail about what he is currently doing while idle. Example relaxing leaning against a tree.
- Contain max 40 words
- Only contain description text, no prefix, suffix or headings
- Translate respons into Swedish.
`;*/