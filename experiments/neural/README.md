# Neural shooter and placer

An experiment next to the bot, not part of it. One network learns to shoot and one learns to place a fleet. It
answers two questions:

- How well can an opponent that studies the bot's layouts exploit them?
- Does a player trained from nothing beat the scripted bot?

## Run

Needs [uv](https://docs.astral.sh/uv/). A CUDA GPU is used when there is one.

```
uv sync
uv run pytest
uv run python -m fathom_neural.train --out runs/sequential --iterations 1000
uv run python -m fathom_neural.evaluate shots --shooter runs/sequential/shooter.pt --layouts sequential
uv run python -m fathom_neural.train --out runs/league --shooter runs/sequential/shooter.pt --placer --iterations 6000
uv run python -m fathom_neural.train --out runs/answer --layouts fathom.train.txt --iterations 1500
```

The first two lines train a shooter on random fleets and measure it. The third trains a shooter and a placer
against each other. The last trains the answer to a layout from a file of its fleets.

Checkpoints go to `runs/`, which is not in the repository.

## Parts

| File | Content |
|---|---|
| `rules.py` | The board, the fleet and every placement of a ship as tensors |
| `layouts.py` | Random fleets, and fleets as text files |
| `game.py` | Thousands of fleets under fire at once, and what each shooter knows |
| `shooter.py` | A residual network, 6 blocks of 64 channels, from the known board to the chance of a ship on each cell |
| `placer.py` | A network that places the fleet ship by ship |
| `train.py` | Training of a shooter alone or of a shooter and a placer against each other |
| `evaluate.py` | Shots a shooter needs, fleets of a placer as a file, win share of two players |

The shooter always fires at the open cell most likely to hold a ship. It learns that chance from positions of
its own games, where the hidden fleet is the answer. The placer is rewarded with the number of shots the
shooter needed. The shooter also meets fleets of earlier versions of the placer.

`tests/test_game.py` replays `tests/referee-game.log`, a copy of the game log in the root of the repository,
through the simulator and expects the results the referee logged.

## Fleets as files

The arena of the Kotlin project and this experiment exchange fleets as text, one fleet per line, a ship as
size, `h` or `v`, x and y:

```
5v91 4h69 4v02 3h20 3h60 3v07 2h34 2v72 2h22 2v51
```

```
./gradlew arena --args="layouts fathom 10000 12 fathom.eval.txt"     # the bot's layouts
./gradlew arena --args="shots learned.txt"                           # scripted shooters on learned layouts
uv run python -m fathom_neural.evaluate layouts --layouts placer:runs/league/placer.pt --out learned.txt
uv run python -m fathom_neural.evaluate shots --shooter runs/answer/shooter.pt --layouts fathom.eval.txt
```

## Results

10,000 fleets per layout, the same for every shooter. The 95% intervals are between 0.06 and 0.08 shots. The
scripted shooters come from `./gradlew arena --args="shots <file>"`. The outputs are in `measurements` in the
root of the repository.

| Shooter | Fleets placed ship by ship at random | The bot's layout | The trained placer's layout |
|---|---|---|---|
| Placement density per ship | 50.86 | 57.73 | 54.19 |
| The bot | 49.42 | 52.59 | 52.08 |
| The bot, sure the opponent places ship by ship | 49.02 | 55.93 | 52.41 |
| Network trained on fleets placed ship by ship | 49.13 | 56.39 | 52.47 |
| Network trained together with the placer | 49.86 | 51.31 | 50.88 |
| Network trained on fleets of that layout only | 49.13 | 46.95 | 50.32 |

The last row is the answer to a layout: what an opponent can reach who has studied it. For the bot's and the
placer's layout it is a network trained on 400,000 fleets and measured on 10,000 others.

Shooting:

- On random fleets the network and the bot are level when both assume such fleets: 49.13 and 49.02.
- The network trained with the placer needs 51.31 shots on the bot's layout, fewer than the bot itself.

Placing:

- The bot's layout costs a density shooter 7 shots more than random fleets and an opponent who has studied it
  2 shots fewer.
- The trained placer costs a density shooter 3 shots more and an opponent who has studied it 1 more.
- The trained placer lays 39% of the ships of 3 cells or more along an edge. Random fleets have 29%, the bot
  95%. It leaves 20 cells that are neither a ship nor next to one, against 16 and 27.

Share of games the bot wins, with its own layout and shooter, when the opponent uses the trained placer's
layout and shoots as:

| Opponent's shooter | The bot wins |
|---|---|
| Network trained on fleets placed ship by ship | 82.8% |
| Network trained together with the placer | 43.6% |
| Network trained on the bot's layout | 14.6% |

Training took 12 minutes for the first network (950 iterations), 3 hours for the shooter and the placer
together (6000) and 25 minutes for each answer (1500), on an RTX 4090.
