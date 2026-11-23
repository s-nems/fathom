// Asserts that the built bundle plays the games the JVM plays. The requests and the histograms are those of
// shouldPlayTheGamesTheJvmAndTheBrowserBothPlay in EngineTest. Run after `./gradlew :engine:wasm`:
//   node engine/check-bundle.mjs
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const BUNDLE = new URL("build/dist/wasmJs/productionLibrary/fathom-engine.mjs", import.meta.url);
const SEED = 7;
const GAMES = 6;
const GOLDEN = [
  { shooter: "fathom", layout: "fathom", gamesByShots: { 49: 1, 50: 3, 51: 1, 58: 1 } },
  { shooter: "hunt-target", layout: "shuffled", gamesByShots: { 53: 1, 59: 2, 63: 1, 65: 1, 70: 1 } },
];

const engine = await import(fileURLToPath(BUNDLE));

for (const { shooter, layout, gamesByShots } of GOLDEN) {
  const request = { shooter, layout, seed: SEED, firstGame: 0, games: GAMES };
  const answer = JSON.parse(engine.cellChunk(JSON.stringify(request)));
  assert.equal(answer.error, undefined, answer.error);
  const played = Object.fromEntries(answer.value.histogram.flatMap((games, shots) => (games > 0 ? [[shots, games]] : [])));
  assert.deepEqual(played, gamesByShots, `${shooter} against ${layout}`);
  console.log(`${shooter} against ${layout}: as on the JVM`);
}
