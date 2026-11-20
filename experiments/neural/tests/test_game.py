"""The simulator must agree with the referee of the Kotlin project on a whole game from its log."""

import re
from pathlib import Path

import torch

from fathom_neural.game import MISS, SUNK, Range
from fathom_neural.rules import BOARD, HORIZONTAL, VERTICAL, Rules, cell, placement
from fathom_neural.shooter import shots_to_sink

RULES = Rules.on("cpu")
# A copy of a log written by `./gradlew run`, a game that player one won.
LOG = Path(__file__).parent / "referee-game.log"
ENEMY_SHIP = re.compile(r"enemy-ship: size=(\d) pos=\((\d),(\d)\) dir=(\w+)")
SHOT = re.compile(r" shot: pos=\((\d),(\d)\) result=(\w+)(?: ship-size=(\d))?")
DIRECTIONS = {"horizontal": HORIZONTAL, "vertical": VERTICAL}


def logged_game() -> tuple[torch.Tensor, list[tuple[int, str]]]:
    """The fleet of the opponent and the shots at it with their results, such as `sunk 3`."""
    log = LOG.read_text()
    ships = [
        placement(int(size), DIRECTIONS[way], int(x), int(y)) for size, x, y, way in ENEMY_SHIP.findall(log)
    ]
    shots = [(cell(int(x), int(y)), f"{result} {size}".strip()) for x, y, result, size in SHOT.findall(log)]
    return torch.tensor([ships]), shots


def test_gives_the_results_the_referee_logged():
    fleet, shots = logged_game()
    shooting_range = Range(RULES, fleet)

    results = []
    for target, _ in shots:
        before = shooting_range.knowledge().observation[0].flatten(start_dim=1)
        shooting_range.shoot(torch.tensor([target]), torch.tensor([True]))
        after = shooting_range.knowledge().observation[0].flatten(start_dim=1)
        if after[MISS, target]:
            results.append("miss")
        elif after[SUNK, target]:
            results.append(f"sunk {int(after[SUNK].sum() - before[SUNK].sum())}")
        else:
            results.append("hit")

    assert results == [result for _, result in shots]
    assert shooting_range.knowledge().done.all()


def test_counts_shots_until_the_last_ship_sinks():
    fleet, _ = logged_game()
    row_by_row = iter(range(BOARD * BOARD))
    last_ship_cell = int(RULES.cells[fleet[0]].sum(dim=0).nonzero().max())

    shots = shots_to_sink(RULES, fleet, lambda knowledge: torch.tensor([next(row_by_row)]))

    assert shots.tolist() == [last_ship_cell + 1]


def test_cells_next_to_a_sunk_ship_are_not_open():
    fleet = torch.tensor([[placement(2, HORIZONTAL, x=0, y=0)]])
    shooting_range = Range(RULES, fleet)

    for target in (cell(0, 0), cell(1, 0)):
        shooting_range.shoot(torch.tensor([target]), torch.tensor([True]))

    closed = (~shooting_range.knowledge().open[0]).nonzero().flatten().tolist()
    assert closed == [cell(0, 0), cell(1, 0), cell(2, 0), cell(0, 1), cell(1, 1)]
