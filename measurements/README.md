# Measurements

Outputs behind the numbers in the README. Every file is the output of the arena or of the neural experiment,
with paths shortened. A file name ends in the number of games and the seed.

| File | Content |
|---|---|
| `table-1000-1.out` | `./gradlew arena --args="1000 1"`, the table in the README |
| `belief-2000-2.out` | Chance of ship-by-ship placing. `fathom-any-fleet` is 0, `belief-x` is x, `fathom-sequential` is 1. `fathom` is 0.7, the value before this run set it to 0.5 |
| `samples-2000-3.out` | Fleets sampled per shot. `fathom` is 2000 |
| `layouts-2000-3.out` | Layout settings, one changed at a time: edge chance, drafts, size from which a ship is long |
| `combos-2000-4.out` | Edge chance and drafts together: `e1.0-d100` is an edge chance of 1.0 with 100 drafts |
| `shots-sequential.out`, `shots-fathom.out` | `./gradlew arena --args="shots <file>"` on the 10,000 fleets the networks are measured on. `<file>.shots` holds the shots of the bot |
| `networks.out` | Shots of trained networks on 10,000 unseen fleets. An answer to a layout is a shooter trained on 400,000 fleets of it |
| `league-training.out` | Log of training a shooter and a placer against each other: shots on random fleets, shots on the placer's fleets, entropy of the placer |
| `league.out` | Shots of the networks on random fleets (`sequential`), the bot's (`fathom`) and the placer's (`learned`), then the share of games the bot wins against three network players |
| `shots-learned.out` | `./gradlew arena --args="shots <file>"` on 10,000 fleets of the trained placer |

The rows `belief-x`, `samples-x` and the layout columns other than those of the README table were temporary
entries in `Arena.kt`. They are not in the code any more, so only `table-1000-1.out` and the `shots` files can
be produced again from this repository.

## Tuning

Run with 2000 games per value on seeds other than 1, with temporary entries in the arena. The outputs are in
the files above.

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
