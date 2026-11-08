  Scripts:
  - npm run dev — runs server (tsx watch on :3000) and Vite dev server (:5173) concurrently
  - npm run build — type-checks then builds the frontend to dist/
  - npm start — runs the server only

  Note: the frontend now calls /chat (no host) and Vite proxies it to Express in dev. Make sure your .env with
  ANTHROPIC_API_KEY is in the project root.


  DB setup:
  npm run db:setup

  Vector generation tests (PowerShell):
  npx tsx --test engine\world\vector-generation\*.test.ts src\editor\canvas\road-planning\*.test.ts src\editor\canvas\HydrationScheduler.test.ts

  Terrain hydration tests (PowerShell):
  npx tsx --test engine\world\hydrator\*.test.ts

  Terrain children use their parent's cardinal neighbours at the same depth.
  An existing neighbour without a tile contributes zero elevation; world edges
  retain the parent's elevation. Other missing terrain remains unchanged.
  Their values stay within 0–1, but their average can differ from the parent.
  Neighbour influence, per-type smoothness and seeded variation are constants
  in hydrateTile.ts. Clustering uses each palette's cluster value (default 0.5),
  with an urban multiplier; higher values concentrate child terrain, biased
  towards neighbouring terrain. Smoothness and clustering are independent.
  The shared planner accepts settings for any terrain type. Existing dominant
  water hydration is unchanged. Generated values differ from earlier versions;
  authored tiles are not overwritten. Edits invalidate affected generated
  terrain and nearby generated vectors so they can be rebuilt.

  Tile terrain stores configured values. `getResolvedTerrain()` calculates
  coverage on demand: ocean reserves its configured share, non-typography land
  types share the remaining area proportionally only when their total exceeds
  it, and typography properties remain unchanged. Lakes do not reserve coverage
  yet. Hydration uses configured terrain and generates ocean from child elevation:
  1 at or below 0.05, 0 at or above 0.15, linearly interpolated in between.
  Missing elevation resolves to zero; when both elevation and ocean are missing,
  ocean resolves to 1 without changing stored values. Authored ocean is preserved.
  Nodes resolve terrain through their calculated tile, or as ocean if no tile
  exists; this does not create or hydrate a tile. Road planning still reports
  missing tiles for hydration. These changes alter
  generated terrain and the coastline of existing maps. The sea mask uses an
  interpolated ocean coverage contour of 0.55. Road planning uses resolved urban
  coverage and treats fully ocean-covered tiles as blocked.

  Generated vector edges are ordinary vectors on hydrated tiles. Like generated
  terrain, they are saved when their tile is detached, including when a child
  edit locks the ancestor. They use the normal placement at deeper depths.
  Generation excludes non-locked detached tiles from new routes. Locked endpoints remain
  untouched, so a connection to one can be represented only on the editable
  side and end at the shared boundary. Dehydrating a generated tile removes its terrain and
  vectors together. Saved vectors remain when terrain changes. Road planning
  uses a finite terrain region and plans routes for urban
  pairs within up to four tiles in any direction, including diagonals. A tile is
  urban for road planning when its urban value is at least 0.1. The urban
  threshold, maximum pair distance and elevation cost are constants in the
  vector generation files. A pair's score must reach 0.06, 0.12, 0.18 or
  0.24 for distances one through four respectively. For two urban tiles the
  score is `urbanA * urbanB * (1 + bonus * min(urbanA, urbanB))`, with
  distance bonuses of 0, 0, 2 and 4. This favours denser urban pairs at
  longer distances without changing nearby connections. The bonus constants
  are configurable in the road planner.
  A shallower-road target has value 0.3; a tile that is also urban can
  participate as either type, using the higher score. Urban-to-road-joint
  scores remain the urban value multiplied by 0.3, without the density bonus.
  Eligible pairs are planned in distance order, with context-only pairs first
  within each distance and row-major tie-breaking. Route selection discounts the elevation-weighted
  cost of complete existing road segments by 50% (configurable via
  `EXISTING_ROAD_DISCOUNT`), encouraging reuse rather than always selecting the
  fastest route for travel. The reported travel time remains undiscounted.
  Routes reuse matching segments, including roads resolved from shallower
  depths, without duplicating tile vectors. Urban
  tiles can also connect to nearby resolved shallower road tiles; those road
  tiles do not form new pairs with one another unless they are urban.
  A cancellable worker accepts a row-major terrain snapshot; replacing
  a request terminates the prior worker and errors are reported to its caller.
  Complete routes can pass through locked cells only along their existing road
  directions; matching protected half-edges count as existing
  network connections. An urban protected cell may receive boundary-only
  connections: the editable half ends at its border without
  claiming network connectivity through the protected cell.
  Result application verifies terrain and protected edges have not changed,
  and validates planned edges before writing to hydrated tiles.
  Terrain painting and vector drawing invalidate generated vectors within the
  maximum pair distance and on existing deeper descendants, without clearing terrain,
  markers or protected data. The editor hydrates the viewport plus a margin
  equal to the maximum pair distance, clipped to the world. A snapshot can
  report unavailable terrain rather
  than guessing flat terrain. Explicitly unavailable snapshot cells are
  impassable to the planner, so they do not prevent planning in other areas.
  The editor plans parent depths before the current depth in a cancellable
  worker, using existing roads and a viewport margin as context. It applies
  routes with a viewport endpoint, including their required margin segments,
  only for the current view and unchanged snapshot. Existing generated roads
  are preserved during pan and zoom. Detached and locked tiles and vectors of
  other types are preserved.
  Worker and application failures are reported in the browser console.
  TODO: A four-tile endpoint distance does not bound detours or their
  dependencies. Earlier routes also influence later route choices, so results
  can depend on visit order. Edits can
  affect routes outside the invalidation margin, and
  viewport-dependent planning can produce different results after panning.
  Snapshot creation and plan application also run synchronously. Dense snapshots
  can be slow to plan because each eligible pair runs a separate route search.

  