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

  Generated vector edges are ordinary vectors on hydrated tiles. Like generated
  terrain, they are saved when their tile is detached, including when a child
  edit locks the ancestor. They use the normal placement at deeper depths.
  Generation leaves locked and already-detached endpoints untouched, so a
  connection to one of them is represented only on the editable side and ends
  at the shared boundary. Dehydrating a generated tile removes its terrain and
  vectors together. Saved vectors remain when terrain changes. Road planning
  uses a finite terrain region and plans routes for urban
  pairs within up to four tiles in any direction, including diagonals. A tile is
  urban for road planning when its urban value is at least 0.1. The urban
  threshold, maximum pair distance and elevation cost are constants in the
  vector generation files. The endpoint-value product sets the connection range:
  below 0.06 no connection, 0.06 to below 0.12 one tile, 0.12 to below 0.18
  two tiles, 0.18 to below 0.24 three tiles, and 0.24 or more four tiles.
  A shallower-road target has value 0.3; a tile that is also urban can
  participate as either type. Eligible pairs are planned in distance order,
  with row-major tie-breaking. Route selection discounts the elevation-weighted
  cost of complete existing road segments by 50% (configurable via
  `EXISTING_ROAD_DISCOUNT`), encouraging reuse rather than always selecting the
  fastest route for travel. The reported travel time remains undiscounted.
  Routes reuse matching segments, including roads resolved from shallower
  depths, without duplicating tile vectors. Urban
  tiles can also connect to nearby resolved shallower road tiles; those road
  tiles do not form new pairs with one another unless they are urban.
  A cancellable worker accepts a row-major terrain snapshot; replacing
  a request terminates the prior worker and errors are reported to its caller.
  Complete routes can pass through locked or detached cells only along their
  existing road directions; matching protected half-edges count as existing
  network connections. An urban protected cell may receive boundary-only
  connections: the editable half ends at its border without
  claiming network connectivity through the protected cell.
  Result application verifies terrain and protected edges have not changed,
  and validates planned edges before writing to hydrated tiles.
  Terrain painting invalidates generated vectors within the maximum pair
  distance and on existing deeper descendants, without clearing terrain,
  markers or protected data. The editor hydrates the viewport plus a margin
  equal to the maximum pair distance, clipped to the world. A snapshot can
  report unavailable terrain rather
  than guessing flat terrain. Explicitly unavailable snapshot cells are
  impassable to the planner, so they do not prevent planning in other areas.
  Once hydration finishes, the editor plans roads in a cancellable worker and
  applies only results for the current view and unchanged snapshot. A new
  plan replaces editable road vectors at that depth across the existing tree;
  detached and locked tiles and vectors of other types are preserved.
  Worker and application failures are reported in the browser console.
  TODO: A four-tile endpoint distance does not bound detours or their
  dependencies. Earlier routes also influence later route choices. Edits can
  affect routes outside the invalidation margin, and
  viewport-dependent planning can produce different results after panning.
  Snapshot creation and plan application also run synchronously, and clearing
  existing roads visits the existing tree at the active depth. Dense snapshots
  can be slow to plan because each eligible pair runs a separate route search.

  