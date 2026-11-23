// Builds the engine for the browser with Gradle and copies the bundle to where the page imports it from.
// With --check it only says whether the bundle is there.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPOSITORY = resolve(WEB, "..");
const BUILT = join(REPOSITORY, "engine/build/dist/wasmJs/productionLibrary");
const BUNDLE = join(WEB, "src/data/engine/bundle");
const ENTRY = "fathom-engine.mjs";
const BUNDLED = /\.(mjs|d\.mts|wasm)$/;
const CHECK_ONLY = process.argv.includes("--check");

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (CHECK_ONLY) {
  if (!existsSync(join(BUNDLE, ENTRY))) {
    fail(`The engine bundle is missing from ${BUNDLE}. Run "pnpm engine" first, it needs a JDK.`);
  }
  process.exit(0);
}

const gradle = spawnSync("./gradlew", [":engine:wasm"], { cwd: REPOSITORY, stdio: "inherit" });
if (gradle.status !== 0) fail("Gradle could not build the engine.");
if (!existsSync(join(BUILT, ENTRY))) fail(`Gradle finished, but ${join(BUILT, ENTRY)} is not there.`);

rmSync(BUNDLE, { recursive: true, force: true });
mkdirSync(BUNDLE, { recursive: true });
for (const name of readdirSync(BUILT).filter((file) => BUNDLED.test(file))) {
  cpSync(join(BUILT, name), join(BUNDLE, name));
}
console.log(`The engine bundle is in ${BUNDLE}.`);
