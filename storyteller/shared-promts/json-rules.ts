export const JSON_INSTRUCTION_RULES =
    `- Preserve all keys, nesting, array lengths, ordering, and values exactly.
- Do not add/remove array items
- Do not modify types
- Do not modify options
- Fields beginning with "_hint_" are contextual guidance
- Use hint fields to generate placeholder values
- Return valid JSON only
- No markdown`;
