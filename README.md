# fathom

Battleships in Kotlin: the rules, a referee, a program that plays one game and writes its log, and a bot for a
tournament.

## Run

```
./gradlew run
```

Plays one game between two instances of the bot and writes `ships-game-yyyyMMdd-HHmmss.log` to the working
directory. The log follows player one. `ships-game-20261120-151401.log` in this repository is one such game.

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

### Placement

A sunk ship tells the opponent that the cells sharing an edge with it are empty. A ship along an edge of the
board has about half as many such cells. The bot draws 20 random layouts in which each ship of 3 cells or more
lies along an edge with a chance of 0.8, and keeps the layout with the most cells that are neither a ship nor
next to one. Ships of 2 cells go anywhere.

### Shooting

For every cell the bot counts the placements of the ships still afloat that pass over it, each ship counted on
its own, and shoots at the highest count. While a hit is open it counts only placements through a hit. The
rules exclude:

- a ship on a cell that shares an edge with a sunk ship,
- a ship next to an open hit that it does not cover, so two hits in a line fix the direction.

This is the same method as the density shooter in the table below, and it scores the same.

### Illegal moves

The bot shoots only at cells it is offered and places a ship of the first size in the list it is given. If the
referee asks again without having accepted the last answer, the bot gives a different one, and it keeps the
ships it places from then on apart at corners too. If the referee passes something no rule allows, such as an
empty list, the bot answers with a last resort instead of throwing.

## Measurements

```
./gradlew arena --args="1000 1"
```

Each shooter sinks the same 1000 fleets of each layout source. The table is the mean number of shots with seed
1. The 95% intervals are between 0.16 and 0.41 shots. A lower number is better for a shooter, a higher one for
a layout.

| Shooter (name in the output) | Fleets placed ship by ship at random (`sequential`) | Fleets placed by the bot (`fathom`) |
|---|---|---|
| Random (`random`) | 97.65 | 97.86 |
| Hunt, then follow the hit (`hunt-target`) | 60.23 | 64.08 |
| Same, hunting on one colour (`hunt-target-parity`) | 56.15 | 58.26 |
| Placement density per ship (`density`) | 50.84 | 57.86 |
| Density that knows how often each placement is used (`density-informed`) | 51.79 | 51.74 |
| The bot (`fathom`) | 50.86 | 57.82 |

The tool also prints the share of games the bot would win against an opponent that places fleets ship by ship
at random and shoots like one of the shooters: 87.5% against `density`, 56.6% against `density-informed`.

The layout gains 7 shots against a density shooter and nothing against one that has learned the bot's habits.
The other columns of the output hold the same measurement without the edge rule (`fathom-no-edge`) and without
the choice among drafts (`fathom-first-draft`).

`src/arena/kotlin` holds the shooters and the layout sources.

## Layout

| Path | Content |
|---|---|
| `src/bot/kotlin/.../board` | Board geometry and the rules a fleet has to keep |
| `src/bot/kotlin/.../bot` | The bot |
| `src/main/kotlin/.../game` | The referee: placement, turns, illegal moves, time limit |
| `src/main/kotlin/.../app` | `main` and the log writer |
| `src/arena/kotlin` | Baseline shooters, layout sources and the shooting range |
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
