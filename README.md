# fathom

Battleships in Kotlin: the rules, a referee, a program that plays one game and writes its log, and a bot for a
tournament.

## Run

```
./gradlew run
```

Plays one game between two instances of the bot and writes `ships-game-yyyyMMdd-HHmmss.log` to the working
directory. The log follows player one. `ships-game-20261120-162406.log` in this repository is one such game.

Gradle needs a JDK 17 or newer to start. The build uses JDK 25 and downloads it when the machine has none.

## Build

```
./gradlew build
```

Compiles with warnings as errors, checks the formatting, runs the tests and writes a coverage report to
`build/reports/kover/html`.

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

For each shot the bot draws up to 2000 random whole fleets that agree with every result so far and shoots at
the cell that is a ship in the largest share of them. A whole fleet respects that ships keep each other apart.
Counting each ship on its own, as the `density` shooter in the table below does, cannot.

The rules exclude:

- a ship on a cell that shares an edge with a sunk ship,
- a ship next to an open hit that it does not cover, so two hits in a line fix the direction.

Fleets are drawn ship by ship, first through the open hits, then the remaining sizes. That does not produce
every fleet equally often, so each fleet counts with a weight that undoes it (importance sampling).
`FleetSamplerTest` compares the result with an exact sum over every fleet on five small positions.

The weight also holds what the bot assumes about the opponent. It gives equal weight to two opponents: one that
places ship after ship at random, which crowds the small ships into what is left, and one for whom every legal
fleet is equally likely.

Drafting a layout and sampling for a shot each stop after 100 ms. If no drawn fleet fits, the bot counts
placements per ship instead.

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
a layout. The bot shoots here without its time limit, so the numbers do not depend on the machine.

| Shooter (name in the output) | Fleets placed ship by ship at random (`sequential`) | Fleets placed by the bot (`fathom`) |
|---|---|---|
| Random (`random`) | 97.65 | 97.86 |
| Hunt, then follow the hit (`hunt-target`) | 60.23 | 64.08 |
| Same, hunting on one colour (`hunt-target-parity`) | 56.15 | 58.26 |
| Placement density per ship (`density`) | 50.84 | 57.86 |
| Density that knows how often each placement is used (`density-informed`) | 51.79 | 51.74 |
| The bot (`fathom`) | 49.45 | 52.80 |
| The bot, sure the opponent places ship by ship (`fathom-sequential`) | 48.90 | 55.85 |
| The bot, any legal fleet alike (`fathom-any-fleet`) | 50.38 | 52.24 |
| The bot without sampling (`fathom-no-sampling`) | 50.86 | 57.82 |

The output has three more layout columns: ship by ship in a random order of sizes (`shuffled`), the bot without
the edge rule (`fathom-no-edge`) and without the choice among drafts (`fathom-first-draft`).

What the table says:

- The layout costs a density shooter 7 shots more than a fleet placed at random does. A shooter that knows how
  often the bot uses each placement loses nothing.
- Sampling whole fleets saves 1.4 shots on fleets placed ship by ship and 5 on the bot's own.
- Each certainty about the opponent wins about half a shot where it is right. Certainty about ship-by-ship
  placing loses 3 shots on the bot's layouts.

The tool also prints the share of games the bot would win against an opponent that places fleets ship by ship
at random and shoots like one of the shooters: 93.7% against `density`, 67.8% against `density-informed`.

### Tuning

Run with 2000 games per value on seeds other than 1, with temporary entries in the arena. The outputs are in
`measurements`.

| Setting | Values tried | Result | Kept |
|---|---|---|---|
| Chance of ship-by-ship placing | 0, 0.1, 0.3, 0.5, 0.7, 0.9, 1 | 0.5 is at most 0.5 shots behind the best value on each of five layout sources | 0.5 |
| Fleets sampled per shot | 500 to 8000 | Flat from 2000 up. 500 and 1000 are 0.2 shots worse on fleets placed ship by ship | 2000 |
| Chance of an edge for a long ship | 0.5 to 1.0 | 1.0 costs a density shooter 0.5 to 0.8 shots more than 0.8, but see below | 0.8 |
| Layout drafts | 5 to 1000 | 100 cost a density shooter 1 shot more than 20, but see below | 20 |
| Size from which a ship is long | 2, 3, 4 | With 2 the informed shooter needs 47.6 shots instead of 52 | 3 |

More drafts and a higher edge chance make the layout easier to learn. A network trained on 400,000 fleets of a
layout sinks 10,000 unseen ones in 47.0 shots for the bot's layout, 45.0 with 100 drafts and 43.7 with 100
drafts and an edge chance of 1.0. Fleets placed ship by ship at random take such a network 49.1. So the layout
is a bet that the opponent has not studied this bot.

`experiments/neural` also trains a shooter and a placer against each other, without the bot. That pair wins
56% of games against the bot. Its shooter needs 51.3 shots on the bot's layout, and the bot 52.1 on the
placer's.

### Time of a call

```
./gradlew arena --args="time"
```

Plays three games through the referee and prints the longest call of each kind. `-Pinterpreted` turns the JIT
compiler off. On an Intel i9-14900K:

| | `placeShip` | `chooseShot` |
|---|---|---|
| First game | 6 ms | 22 ms |
| First game, JIT off | 9 ms | 100 ms |

The limit is 500 ms.

## Source tree

| Path | Content |
|---|---|
| `src/bot/kotlin/.../board` | Board geometry and the rules a fleet has to keep |
| `src/bot/kotlin/.../bot` | The bot |
| `src/main/kotlin/.../game` | The referee: placement, turns, illegal moves, time limit |
| `src/main/kotlin/.../app` | `main` and the log writer |
| `src/arena/kotlin` | Baseline shooters, layout sources and the shooting range |
| `src/test/kotlin` | Tests |
| `experiments/neural` | A neural shooter and placer in Python, outside the build |

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
