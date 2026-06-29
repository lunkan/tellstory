import Anthropic from "@anthropic-ai/sdk";
import { MessageCreateParamsNonStreaming, TextBlockParam } from "@anthropic-ai/sdk/resources";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

/*
Cache these parts

Put stable content first:

- system prompt
- coding rules
- repo architecture
- style guide
- shared examples
- tool definitions
- long docs

Append later:

- user task
- file diff
- current error
- specific request

Anthropic explicitly recommends:

static content at the beginning of the prompt.

First request (creates cache)

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 4096,

  system: [
    {
      type: "text",
      text: LARGE_SHARED_PROMPT,
      cache_control: {
        type: "ephemeral",
        ttl: "1h"
      }
    }
  ],

  messages: [
    {
      role: "user",
      content: "Implement auth middleware"
    }
  ]
});

The first request pays:

normal input cost
cache write cost

Subsequent requests become much cheaper.

Then follow-up requests

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 4096,

  system: [
    {
      type: "text",
      text: LARGE_SHARED_PROMPT,
      cache_control: {
        type: "ephemeral",
        ttl: "1h"
      }
    }
  ],

  messages: [
    {
      role: "user",
      content: "Implement Redis session storage"
    }
  ]
});


!!!!!
Anthropic says:

cache entry only becomes available after the first response begins.

1. Send first request
2. Wait until streaming begins
3. Send remaining parallel requests

Use:
ttl: "1h"
*/

export type PromtOptions = {
    model?: string;
    maxTokens?: number;
    sharedPromt?: string
};

const defaultPromtOptions = {
    model: "claude-sonnet-4-6", //"claude-sonnet-4-20250514",
    max_tokens: 4096, //2048, //1024,
}

const defaultCacheOptions: TextBlockParam = {
    type: "text",
    text: '',
    cache_control: {
        type: "ephemeral",
        ttl: "1h"
    }
}

export async function generateReply(message: string, options?: PromtOptions): Promise<string> {
    const promptArgs: MessageCreateParamsNonStreaming = {
        model: options?.model || "claude-sonnet-4-6", //"claude-sonnet-4-20250514",
        max_tokens: options?.maxTokens || 4096, //2048, //1024,
        messages: [{ role: "user", content: message }],
    };

    if (options?.sharedPromt) {
        promptArgs.system = [{
            ...defaultCacheOptions,
            text: options.sharedPromt,
        }];
    }

    const response = await anthropic.messages.create(promptArgs);


    /*const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6", //"claude-sonnet-4-20250514",
      max_tokens: 4096, //2048, //1024,
      system: [{
        type: "text",
        text: sharedPromt,
        cache_control: {
          type: "ephemeral",
          ttl: "1h"
        }
      }],
      messages: [{ role: "user", content: message }],
    });*/

    const first = response.content[0];
    return first.type === "text" ? first.text : "";
}

export async function generateJSONReply(message: string, options?: PromtOptions): Promise<object> {
    const response = await generateReply(message, options);
    const sanitizedResponse = sanitizeJsonResponse(response);
    try {
        return JSON.parse(sanitizedResponse) as object;
    } catch (e) {
        console.log('ERROR:1', sanitizedResponse);
        console.log('ERROR:2', response);
        return {};
    }
}

function sanitizeJsonResponse(text: string): string {
    // Make sure last object doesn't have comma
    return text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
}
