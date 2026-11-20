# Measurements

Outputs behind the numbers in the README. Every file is the output of the arena or of the neural experiment,
with paths shortened. A file name ends in the number of games and the seed.

| File | Content |
|---|---|
| `table-1000-1.out` | `./gradlew arena --args="1000 1"`, the table in the README |
| `belief-2000-2.out` | Chance of ship-by-ship placing. `fathom-any-fleet` is 0, `belief-x` is x, `fathom` is 0.7, `fathom-sequential` is 1 |
| `samples-2000-3.out` | Fleets sampled per shot. `fathom` is 2000 |
| `layouts-2000-3.out` | Layout settings, one changed at a time: edge chance, drafts, size from which a ship is long |
| `combos-2000-4.out` | Edge chance and drafts together: `e1.0-d100` is an edge chance of 1.0 with 100 drafts |
| `shots-sequential.out`, `shots-fathom.out` | `./gradlew arena --args="shots <file>"` on the 10,000 fleets the networks are measured on. `<file>.shots` holds the shots of the bot |
| `networks.out` | Shots of trained networks on 10,000 unseen fleets. An answer to a layout is a shooter trained on 400,000 fleets of it |
| `league-training.out` | Log of training a shooter and a placer against each other: shots on random fleets, shots on the placer's fleets, entropy of the placer |
| `league.out` | Shots of the networks on random fleets (`sequential`), the bot's (`fathom`) and the placer's (`learned`), then the share of games the bot wins against three network players |
| `shots-learned.out` | `./gradlew arena --args="shots <file>"` on 10,000 fleets of the trained placer |

The rows `belief-x`, `samples-x` and the layout columns other than those of the README table were temporary
entries in `Arena.kt`.
