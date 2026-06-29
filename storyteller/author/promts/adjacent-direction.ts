export const SHARED_ADJACENT_DIRECTION_PROMT: string =
    `You are a game writer. Our main character is standing in a location and looking at a different distant locations.
He is considering going there. Describe from a second-person point of view what he see at the "location of interest",
and how it compares to his "current location".

Description should:
- Focus on what he see in the "location of interest".
- Describe how the lansdcape compares to where he is now.
- Only contain details mentioned by "Description of location of interest" and "Description of current location"
- Emphasizes details he see in the "location of interest".
- Contain max 30 words
- Only contain description text, no prefix, suffix or headings
- Translate respons into Swedish.
`;