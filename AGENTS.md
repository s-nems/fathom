# AGENTS.md

`fathom` is a Battleships game in Kotlin: the rules, a referee, a program that plays one game and writes its
log, and a bot for a tournament run by someone else's engine.

## Commands

| Task | Command |
|---|---|
| Format | `./gradlew spotlessApply` |
| Build, check, test | `./gradlew build` |
| One test class | `./gradlew test --tests '*FleetTest'` |
| Play one game | `./gradlew run` |
| Shots per shooter and layout | `./gradlew arena --args="1000 1"` |
| Longest calls of the bot | `./gradlew arena --args="time"`, add `-Pinterpreted` to turn the JIT compiler off |
| Write fleets of a layout source | `./gradlew arena --args="layouts fathom 1000 1 fleets.txt"` |
| Shoot at fleets from a file | `./gradlew arena --args="shots fleets.txt"` |

Run the formatter and the build as two invocations.

## Layout

| Path | Content |
|---|---|
| `bot` | Module the tournament copies: the provided `Bot.kt`, `board` (rules), `bot` (the bot) |
| `app` | Module with `game` (referee) and `app` (one game and its log). Depends on `bot` |
| `arena` | Module with opponents and measurements, not part of the program. Depends on `bot` and `app` |
| `buildSrc` | `fathom-module`, the build settings every module shares |
| `experiments/neural` | A neural shooter and placer in Python, with its own README. Not part of the build |
| `measurements` | Outputs of the arena behind the numbers in the README |

## Rules of the code

- `Bot.kt` stays byte for byte as provided.
- `bot/src/main` uses the Kotlin standard library only. It compiles at language level 2.1 against the JDK 17
  API, and the build fails on anything newer.
- The bot never throws. It answers within the rules whenever its arguments allow that. It keeps no state
  between games.
- `Game` knows nothing about logs or wall-clock time. It reports events to an observer.
- Randomness and time are passed in, so every test is deterministic. Tests build the bot with `untimedBot`.
- No literal with a meaning stays unnamed.
- KDoc of one or two sentences on each type, saying what the signature cannot.

## Tests

- Plain `@Test` methods named `should...`, with `// given`, `// when`, `// then`.
- Parameterised tests list their rows as literals.
- Sample ships come from `SampleFleets`, scripted players from `ScriptedBot`.
- `ReplayingLogTest` replays every log in `app/src/test/resources/logs` through the referee and compares the
  log written with the original.

## Working here

- A step is done when `./gradlew build` passes and a separate agent has reviewed it.
- A change to the bot's play is accepted on a measurement from the arena, not on reasoning.
- Markdown in this repository is short and factual.
- Conventional Commits as `type: Description`, one logical change per commit. Never push.
