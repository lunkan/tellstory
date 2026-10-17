import { contours } from "d3-contour";
import { QuadNode } from "../../../../engine/world/quad-node";
import { GridBounds } from "../types";

const THRESHOLDS = [0.0, 0.01, 0.2, 0.4, 0.6, 0.8, 0.93];

const COLORS = [
    "#247ba0", // sea
    "#7ca888", // lowlands
    "#b6c28d", // hills
    "#e5d493", // highlands
    "#c9a180", // mountains
    "#ebe7e191", // peaks
    "#f0ebe1", // snowy peaks
];

type DrawElevationOptions = {
    ctx: CanvasRenderingContext2D;
    gridBounds: GridBounds;
    tileSize: number;
    nodes: QuadNode[];
}

export function drawElevation(options: DrawElevationOptions): void {
    const { ctx, gridBounds, tileSize, nodes } = options;
    const { xSize, ySize } = gridBounds;
    const originX = gridBounds.x * tileSize;
    const originY = gridBounds.y * tileSize;

    // One value per cell, row-major (index = y * xSize + x) - the layout d3-contour expects
    const values = new Array<number>(xSize * ySize).fill(0);
    for (const node of nodes) {
        const x = Math.round((node.bounds.x - originX) / tileSize);
        const y = Math.round((node.bounds.y - originY) / tileSize);
        if (x < 0 || y < 0 || x >= xSize || y >= ySize) {
            continue;
        }

        values[y * xSize + x] = node.getTile()?.getTerrain('elevation')?.value ?? 0;
    }

    const bands = contours()
        .size([xSize, ySize])
        .thresholds(THRESHOLDS)
        .smooth(true)(values);

    // Contour coordinates are in cells - convert to grid units, the layer transform handles zoom
    bands.forEach((band, i) => {
        ctx.beginPath();

        for (const polygon of band.coordinates) {
            for (const ring of polygon) {
                ring.forEach(([x, y], j) => {
                    const gridX = originX + x * tileSize;
                    const gridY = originY + y * tileSize;

                    if (j === 0) ctx.moveTo(gridX, gridY);
                    else ctx.lineTo(gridX, gridY);
                });

                ctx.closePath();
            }
        }

        ctx.fillStyle = COLORS[i];
        ctx.fill("evenodd");
    });
}

// https://d3js.org/d3-contour?utm_source=chatgpt.com

// npm install d3-contour

/*
import { contours } from "d3-contour";

function drawTerrain(ctx, elevation, width, height, scale) {
  const thresholds = [0.1, 0.2, 0.4, 0.6, 0.8, 0.93];

  const colors = [
    "#247ba0", // sea
    "#52a66a", // lowlands
    "#a8bd59", // hills
    "#e2c45b", // highlands
    "#c98248", // mountains
    "#eee0c2", // peaks
  ];

  ctx.clearRect(0, 0, width * scale, height * scale);
  ctx.fillStyle = "#174c70";
  ctx.fillRect(0, 0, width * scale, height * scale);

  const bands = contours()
    .size([width, height])
    .thresholds(thresholds)
    .smooth(false)(elevation);

  // Draw increasingly high regions over the sea/background.
  bands.forEach((band, i) => {
    ctx.beginPath();

    for (const polygon of band.coordinates) {
      for (const ring of polygon) {
        ring.forEach(([x, y], j) => {
          if (j === 0) ctx.moveTo(x * scale, y * scale);
          else ctx.lineTo(x * scale, y * scale);
        });
        ctx.closePath();
      }
    }

    ctx.fillStyle = colors[i + 1];
    ctx.fill("evenodd");
  });
}


const grid = [
  [0,    0,    0,    0,    0,    0,    0],
  [0,    0.05, 0.1,  0.1,  0.1,  0,    0],
  [0,    0.1,  0.3,  0.4,  0.2,  0.05, 0],
  [0,    0.1,  0.4,  0.8,  0.4,  0.1,  0],
  [0,    0.05, 0.2,  0.4,  0.3,  0.1,  0],
  [0,    0,    0.1,  0.2,  0.1,  0.05, 0],
  [0,    0,    0,    0,    0,    0,    0]
];

const height = grid.length;
const width = grid[0].length;

const elevation = grid.flat();

*/