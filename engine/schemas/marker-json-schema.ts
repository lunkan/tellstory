import { z } from "zod";
//import { zodTextFormat } from "openai/helpers/zod";

// player-starting
const CategorySchema = z.enum([
    "landmark",
]);

export const MarkerSchema = z.object({
    //id: z.number().int().describe("A unique numeric identifier for this marker."),
    name: z.string().describe(
        "The specific thing represented by the marker. " +
        "Use a concise, human-readable name, such as " +
        '"Food store", "Waterfall", or "Small grove".'
    ),
    category: CategorySchema.describe("The type of the marker. Choose the category that best describes " +
        "the thing represented by the marker."),

    attention: z.object({
        min: z.number().int().min(1).max(10).describe(
            "The lower bound of the marker's familiarity range. " +
            "It represents how far from the object a person could be while still " +
            "reasonably knowing about the object or what it represents."
        ),

        max: z.number().int().min(1).max(10).describe(
            "The upper bound of the marker's familiarity range. " +
            "It represents how far from the object a person could be while still " +
            "reasonably knowing about the object or what it represents."
        ),
    }).describe(
        "Describes the geographic range within which the object is likely to be " +
        "known or recognized by people familiar with the surrounding area. " +
        "This is about familiarity and awareness, not physical visibility. " +
        "The range depends on the type of object and on its individual size, " +
        "prominence, cultural importance, uniqueness, and fame. " +
        "A small but famous object can have a much larger range than a large " +
        "but ordinary object. For example, a small but famous spring may be known " +
        "from far away, while a large but unremarkable building may only be known " +
        "locally. " +
        "The scale ranges from 1 (approximately 30 m) to 10 (approximately 100 km). " +
        "min is the lower bound of the range and max is the upper bound."
    ),

    tags: z.array(z.string()).describe(
        "Tags describing the environments, areas, or locations where this marker " +
        "is likely to be found. Tags represent the typical setting or context in " +
        "which the object occurs, rather than properties of the object itself. " +
        "For example, a food store might be tagged 'urban', while a hiking trail " +
        "might be tagged 'forest'. A marker may have multiple tags when it is " +
        "commonly found in multiple types of environments. Only use tags from " +
        "the available tag list."
    ),

    meta: z.object({
        color: z.string().describe(
            "An hex color used to visually represent this marker."
        ),
    }),
}).describe(
    "A marker represents a real-world type of thing, place, or feature that " +
    "could be encountered in the world. Markers are abstract descriptions of " +
    "things rather than specific instances or exact locations. For example, " +
    '"church", "food store", "park", or "fountain" can each be a marker. ' +
    "Each marker describes a category of real-world things that may occur in " +
    "different locations. Generate markers that are relevant to the user's request."
);

//const MarkersSchema = z.array(MarkerSchema);

export function createMarkerSchema(tags: string[]) {
    return MarkerSchema.extend({
        tags: z.array(z.enum(tags as [string, ...string[]])).describe(
            "Tags describing the environments, areas, or locations where this marker " +
            "is likely to be found. Tags represent the typical setting or context in " +
            "which the object occurs, rather than properties of the object itself. " +
            "For example, a food store might be tagged 'urban', while a hiking trail " +
            "might be tagged 'forest'. A marker may have multiple tags when it is " +
            "commonly found in multiple types of environments. Only use tags from " +
            "the available tag list."
        ),
    });
}