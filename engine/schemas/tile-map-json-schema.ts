import { z } from "zod";

const ShapeSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("circle").describe("A circular shape defined by its center point and radius."),
        x: z.number().describe("The X coordinate of the center of the circle in meters, measured from the map origin (0,0)."),
        y: z.number().describe("The Y coordinate of the center of the circle in meters, measured from the map origin (0,0)."),
        radius: z.number().describe("The radius of the circle in meters."),
    }),
    z.object({
        type: z.literal("rectangle").describe("A rectangular shape defined by its position, dimensions, and rotation."),
        x: z.number().describe("The X coordinate of the rectangle's origin in meters, measured from the map origin (0,0)."),
        y: z.number().describe("The Y coordinate of the rectangle's origin in meters, measured from the map origin (0,0)."),
        width: z.number().describe("The width of the rectangle in meters."),
        height: z.number().describe("The height of the rectangle in meters."),
        rotation: z.number().describe("The rotation of the rectangle in degrees around its origin. 0 degrees means no rotation."),
    }),
    z.object({
        type: z.literal("polygon").describe("A polygon defined by a sequence of points connected in order."),
        center: z.object({
            x: z.number().describe("The X coordinate of the polygon's center in meters, measured from the map origin (0,0)."),
            y: z.number().describe("The Y coordinate of the polygon's center in meters, measured from the map origin (0,0)."),
        }).describe("The polygon's center position in map coordinates, measured in meters from the map origin (0,0)."),
        points: z.array(
            z.object({
                x: z.number().describe("The X coordinate of the polygon point in meters, measured from the map origin (0,0)."),
                y: z.number().describe("The Y coordinate of the polygon point in meters, measured from the map origin (0,0)."),
            })
        ).describe("The vertices of the polygon in drawing order. The last point is implicitly connected to the first point."),
    }),
    z.object({
        type: z.literal("line").describe("A vector or line segment defined by two points and a width."),
        width: z.number().describe("The width or thickness of the line in meters."),
        point1: z.object({
            x: z.number().describe("The X coordinate of the first endpoint in meters, measured from the map origin (0,0)."),
            y: z.number().describe("The Y coordinate of the first endpoint in meters, measured from the map origin (0,0)."),
        }).describe("The first endpoint of the line."),
        point2: z.object({
            x: z.number().describe("The X coordinate of the second endpoint in meters, measured from the map origin (0,0)."),
            y: z.number().describe("The Y coordinate of the second endpoint in meters, measured from the map origin (0,0)."),
        }).describe("The second endpoint of the vector."),
    }),
]);

export const TileMapSchema = z.object({
    bounds: z.object({
        x: z.number().int().describe("The physical x coordinate of the map in meters."),
        y: z.number().int().describe("The physical y coordinate of the map in meters."),
        width: z.number().int().describe("The physical width of the map in meters."),
        height: z.number().int().describe("The physical height of the map in meters."),
    }).describe("The map is a rectangle whose origin is at coordinate (x,y). These values define its physical width and height in meters."),
    objects: z.array(
        z.object({
            id: z.string().describe("The unique identifier for the specific object."),
            type: z.string().describe("The semantic type of the object, describing what the object represents."),
            attention: z.number().int().min(0).max(10).describe("The importance or attention level of the object on a scale from 0 to 10. 0 means no particular attention is required; 10 means the object is extremely important and should receive the highest attention."),
            description: z.string().describe("A concise description of what the object represents and any relevant visual or semantic characteristics."),
            shape: ShapeSchema.describe("The geometric shape used to represent the object on the map."),
        })
    ).describe("The objects contained in the map, including their semantic description, importance, position, and geometric representation."),
});

export type TileMap = z.infer<typeof TileMapSchema>;
export type TileMapObject = TileMap["objects"][number];
export type TileShape = TileMap["objects"][number]["shape"];

export type TileMapCircleShape = Extract<
    TileMap["objects"][number]["shape"],
    { type: "circle" }
>;

export type TileMapRectangleShape = Extract<
    TileMap["objects"][number]["shape"],
    { type: "rectangle" }
>;

export type TileMapLineShape = Extract<
    TileMap["objects"][number]["shape"],
    { type: "line" }
>;

export function isCircleShape(
    shape: TileShape
): shape is TileMapCircleShape {
    return shape.type === "circle";
}

export function isRectangleShape(
    shape: TileShape
): shape is TileMapRectangleShape {
    return shape.type === "rectangle";
}

export function isLineShape(
    shape: TileShape
): shape is TileMapLineShape {
    return shape.type === "line";
}