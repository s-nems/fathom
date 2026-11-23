# web

The studio: a page to play against the bot, replay games, run the arena and see heat maps. The
[engine](../engine/README.md) computes everything in the browser. The build is static files.

## Run

Needs Node 22+, [pnpm](https://pnpm.io) and a JDK for the engine.

| Command        | What it does                                                                                 |
| -------------- | -------------------------------------------------------------------------------------------- |
| `pnpm install` | Installs dependencies                                                                        |
| `pnpm engine`  | Runs `./gradlew :engine:wasm` and copies the bundle to `src/data/engine/bundle` (not in git) |
| `pnpm dev`     | Serves the page while working on it                                                          |
| `pnpm build`   | Checks bundle, formatting and types, writes `dist`                                           |
| `pnpm preview` | Serves `dist`                                                                                |
| `pnpm test`    | Runs the tests                                                                               |
| `pnpm format`  | Formats the sources                                                                          |

Run `pnpm engine` again after a change to the Kotlin sources.

## Hosting

Serve `dist` from the root of a domain. `.wasm` must be sent as `application/wasm`. Views are hash routes,
so no rewrites are needed.

## Sources

| Path                         | Content                                                      |
| ---------------------------- | ------------------------------------------------------------ |
| `src/app`                    | App, top bar, routing                                        |
| `src/features/<view>`        | One view: components, its own logic and stylesheet           |
| `src/features/replay/player` | The replay of a game, also used by Play                      |
| `src/features/arena/runs`    | Arena runs: cells split into chunks, summed, resumed         |
| `src/game`                   | Game logic shared by views: board, fleet, players, shot text |
| `src/ui/board`               | The board and its layers                                     |
| `src/ui/controls`            | Buttons, fields, panels, alerts                              |
| `src/lib`                    | Helpers with no game meaning                                 |
| `src/data/engine`            | Workers that run the engine, and their pool                  |
| `src/data/storage`           | Runs and games in IndexedDB, in memory without it            |
| `src/data/api`               | What views call: engine, runs and history as one object      |
| `src/styles`                 | Tokens and base styles                                       |

- Tests sit next to their source as `*.test.ts`.
- `@/` is `src`. Imports inside one folder are relative.
- A class of one view carries its prefix: `home-`, `play-`, `replay-`, `arena-`, `dist-`.

## Views

| Hash              | Content                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `#/home`          | Entry, a live bot game, links to the latest run and games                                       |
| `#/play`          | Place a fleet, play, review. `?game=<id>` reviews a kept game                                   |
| `#/replay`        | Two bots, a kept game (`?game=<id>`) or a log file, shot by shot                                |
| `#/arena`         | Mean shots per shooter and layout, one pairing in detail, head to head. `?run=<id>` opens a run |
| `#/distributions` | Where a layout puts ships, where a shooter shoots                                               |

## History

- Runs and the last 50 games stay in IndexedDB of the browser that made them.
- A game under way is kept in `sessionStorage` and survives a reload.
- A run under way continues after a reload. Without Web Locks it comes back as cancelled.
- A game watched from an arena link is not kept.
- Home clears runs and games, Arena clears runs.

## Differences from the tournament

- No time limit for either side.
- A run gives the numbers of `./gradlew arena` for the same games and seed.
- Weights of `fathom` come from the bot through `ShotObserver`. Watching does not change a shot.
