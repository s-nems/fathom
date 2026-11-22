# fathom

Battleships in Kotlin: a bot for a tournament, and a program that plays one game and writes its log.

| Directory | Content |
|---|---|
| `bot` | The tournament bot and the rules of the board |
| `app` | The referee and the program that plays one game |
| `arena` | Other shooters and layouts to measure the bot against |
| `measurements` | Outputs of the arena behind the numbers below, and the tuning |
| `experiments/neural` | A neural shooter and placer in Python, outside the build |

`bot`, `app` and `arena` are Gradle modules. `app` uses `bot`, `arena` uses both.

## Commands

| Command | What it does |
|---|---|
| `./gradlew run` | Plays one game between two instances of the bot and prints the path of its log |
| `./gradlew build` | Compiles, checks the formatting, runs the tests, writes coverage to `build/reports/kover/html` |
| `./gradlew arena --args="1000 1"` | Measures shooters on 1000 fleets per layout, seed 1 |
| `./gradlew arena --args="time"` | Prints the longest calls of the bot |

Gradle needs JDK 17 or newer to start. The build uses JDK 25 and downloads it when the machine has none.

The log is `ships-game-yyyyMMdd-HHmmss.log` in the working directory and follows player one.
`ships-game-20261120-162406.log` in this repository is one such game.

## The bot

| Property | Value |
|---|---|
| Class | `io.github.snems.fathom.bot.FathomBot` |
| Sources for the tournament | Everything in `bot/src/main/kotlin`, including the provided `Bot.kt`, unchanged |
| Dependencies | Kotlin standard library |
| Compiled for | Kotlin language level 2.1, JDK 17 API |
| State | None between games, no threads, public constructor without arguments |

The build fails if the bot uses a library, a newer language feature or a newer JDK API.

**Placement.** A sunk ship shows the opponent that the cells sharing an edge with it are empty, and a ship along
an edge of the board has about half as many such cells. The bot draws 20 random layouts in which each ship of 3
cells or more lies along an edge with a chance of 0.8, and keeps the one with the most cells that are neither a
ship nor next to one.

**Shooting.** For each shot the bot draws up to 2000 random whole fleets that agree with every result so far
and shoots at the cell that is a ship in the largest share of them. The fleets are weighted (importance
sampling) so that the shares are those of an even mix of two opponents: one that places ship after ship at
random and one for whom every legal fleet is equally likely. `FleetSamplerTest` compares the result with an
exact sum over every fleet on five small positions.

**Time.** Drafting a layout and sampling for a shot each stop after 100 ms. The limit is 500 ms. Longest calls
on an Intel i9-14900K:

| First game | `placeShip` | `chooseShot` |
|---|---|---|
| With the JIT compiler | 6 ms | 22 ms |
| Without it (`-Pinterpreted`) | 9 ms | 100 ms |

**Illegal moves.** The bot shoots only at cells it is offered and places the first size in the list it is
given. Asked again after a refused answer, it gives a different one. It never throws.

## Measurements

Mean shots to sink 1000 fleets, seed 1. The 95% intervals are between 0.16 and 0.41 shots. Lower is better for
a shooter, higher for a layout. The name in the output is in brackets.

| Shooter | Fleets placed ship by ship at random | Fleets placed by the bot |
|---|---|---|
| Random (`random`) | 97.65 | 97.86 |
| Hunt, then follow the hit (`hunt-target`) | 60.23 | 64.08 |
| Same, hunting on one colour (`hunt-target-parity`) | 56.15 | 58.26 |
| Placement density per ship (`density`) | 50.84 | 57.86 |
| Density that knows how often the bot uses each placement (`density-informed`) | 51.79 | 51.74 |
| The bot (`fathom`) | 49.45 | 52.80 |
| The bot without sampling (`fathom-no-sampling`) | 50.86 | 57.82 |

- The bot's layout costs a density shooter 7 shots more than a random fleet. A shooter that knows the layout
  loses nothing.
- Sampling whole fleets saves 1.4 shots on random fleets and 5 on the bot's own.
- Against an opponent with random fleets the bot wins 93.7% of games when the opponent shoots as `density` and
  67.8% as `density-informed`.
- A network trained on 400,000 of the bot's layouts sinks them in 47.0 shots, against 49.1 for random fleets.
  The layout is a bet that the opponent has not studied this bot.
- A network shooter and placer trained against each other, without the bot, win 56% of games against it.

The settings tried and why each value was kept are in `measurements/README.md`, the networks in
`experiments/neural/README.md`.

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

`ReplayingLogTest` replays the ships and shots of a game log through the referee and compares the log written
with the original, byte for byte. It runs on a log of this program and, locally, on the sample log that came
with the task, which is not in the repository.

## License

MIT, see `LICENSE`. `Bot.kt` came with the task and is not covered by it.

How AI was used: `AI_USAGE.md`.
