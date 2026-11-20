# fathom

Battleships in Kotlin: the rules, a referee, a program that plays one game and writes its log, and a bot for a
tournament.

## Run

```
./gradlew run
```

Plays one game between two instances of the bot and writes `ships-game-yyyyMMdd-HHmmss.log` to the working
directory. The log follows player one. `ships-game-20261120-135653.log` in this repository is one such game.

Gradle needs a JDK 17 or newer to start. The build uses JDK 25 and downloads it when the machine has none.

## Build

```
./gradlew build
```

Compiles with warnings as errors, checks the formatting, runs the tests and writes a coverage report to
`build/reports/kover`.

## The bot

| | |
|---|---|
| Class | `io.github.snems.fathom.bot.FathomBot` |
| Sources to copy | `src/bot/kotlin/io/github/snems/fathom` |
| Dependencies | Kotlin standard library |
| Compiled for | Kotlin language level 2.1, JDK 17 API |

`src/bot/kotlin` is a separate source set with its own compiler settings, so the build fails if the bot uses a
library, a newer language feature or a newer JDK API. It also holds the provided `Bot.kt`, unchanged.

The bot has a public constructor without arguments, keeps no state between games and starts no threads.

At this milestone it places ships and shoots at random among the legal moves.

## Layout

| Path | Content |
|---|---|
| `src/bot/kotlin/.../board` | Board geometry and the rules a fleet has to keep |
| `src/bot/kotlin/.../bot` | The bot |
| `src/main/kotlin/.../game` | The referee: placement, turns, illegal moves, time limit |
| `src/main/kotlin/.../app` | `main` and the log writer |
| `src/test/kotlin` | Tests |

## Assumptions

The statement leaves these open.

| Question | Decision |
|---|---|
| Who is the opponent in the local game? | A second instance of the bot. |
| Which calls does the 500 ms limit cover? | `placeShip`, `chooseShot` and `onShotResult`. One call over the limit loses the game. |
| What if a bot throws? | It counts as an illegal move. |
| Are illegal moves logged? | No. The sample log has no line for them. |
| What does the log show after a forfeit? | `game-over`, then the ships the opponent had placed by then. |
| In what order are ships logged? | In the order they were accepted. |
| What is the time on a line? | The wall-clock time the line was written. |
| How is a slow bot stopped? | It is not. The time is checked when the call returns. |

## Tests

`ReplayingLogTest` takes a game log, replays its ships and shots through the referee with two scripted bots and
compares the log written with the original, byte for byte. It runs on a log of this program. Locally it also
runs on the sample log that came with the task, which is not in the repository.

## License

MIT, see `LICENSE`. `Bot.kt` came with the task and is not covered by it.

How AI was used: `AI_USAGE.md`.
