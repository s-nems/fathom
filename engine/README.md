# engine

The bot, the referee and the arena compiled to WebAssembly for the page in `web`. Runs in the browser, no
server.

## Build

| Task | Command |
|---|---|
| Compile for the JVM and the browser, test on the JVM | `./gradlew build` |
| Write the bundle to `engine/build/dist/wasmJs/productionLibrary` | `./gradlew :engine:wasm` |
| Check that the bundle plays as the JVM does | `node engine/check-bundle.mjs` |

Only `:engine:wasm` downloads Node, Yarn and Binaryen. Other builds skip the tasks that need them, unless
`-Pengine.browser=true` is set.

## Sources

- `bot`, `app` (referee) and `arena` are compiled in place, so they are common Kotlin. Files that need the
  JVM are excluded in `build.gradle.kts`.
- `arena/Sequential.kt` replaces `Parallel.kt` of the arena: the page uses workers instead of threads.
- `src/commonMain/.../engine`: `Engine` and `JsonEngine` in the root, one package per topic (`games`, `play`,
  `heat`, `measure`, `logs`, `catalogue`, `board`).
- `src/wasmJsMain`: the exports. `src/jvmTest`: tests that need the JVM.

## Functions

JSON string in, JSON string out: `{"value": ...}` or `{"error": "why"}`. Nothing throws. Shapes are in
`web/src/data/api/types.ts`.

| Function | Request | Value |
|---|---|---|
| `catalogue()` | none | `{layouts, shooters, boardSize, fleet, limits}` |
| `playGame(request)` | `{one, two, seed, firstShooter?}` | `GameRecord` |
| `playHumanGame(request)` | `{fleet, opponent, seed, firstShooter?, shots}` | `{game, yourTurn, over}` |
| `readLog(title, text)` | text of a `ships-game-*.log` | `GameRecord` |
| `layoutHeat(request)` | `{source, count, seed}` | `LayoutHeat` |
| `drawLayout(request)` | `{source, seed}` | `Ship[]` |
| `shooterHeat(request)` | `{shooter, layout, games, seed, firstGame?}` | `ShooterHeat` |
| `cellChunk(request)` | `{shooter, layout, seed, firstGame, games}` | `{histogram}` |
| `measurement(request)` | `{shooter, layout, histogram}` | `Cell` |

- `playHumanGame` keeps no state. `shots` holds every shot of the human so far and the game is replayed from
  the start on each call. Until the game ends the value hides the opponent's unsunk ships and weights.
  `millis` of a shot differs between calls.
- `limits`: `partGames` 10 000, `runGames` 1 000 003, `shooterHeatGames` 2 000, `heatLayouts` 5 000.

## Arena in parts

- A call blocks its thread, so the page calls from Web Workers, one module instance each.
- A game depends only on the seed of the run and its number. Histograms of `cellChunk` parts add up to the
  cell, and the cell equals `./gradlew arena` for the same seed and games.
- Proof: a JVM test compares added parts with the arena, another pins histograms as literals, and
  `check-bundle.mjs` asserts the same literals against the bundle.
- `measurement` turns a summed histogram into the mean and its 95% interval.
- `shooterHeat` splits the same way: `turns` of the parts add up.
- `density-informed` studies 10 000 layouts the first time a worker meets it, a few seconds per worker.

Not done: sharing that study between workers, `layoutHeat` in parts.
