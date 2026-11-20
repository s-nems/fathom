import torch

from fathom_neural import layouts
from fathom_neural.rules import HORIZONTAL, VERTICAL, Rules, placement
from tests.fleets import is_legal

RULES = Rules.on("cpu")


def test_sequential_fleets_are_legal():
    fleets = layouts.sequential(RULES, 500, torch.Generator().manual_seed(1))

    assert all(is_legal(fleet) for fleet in fleets)


def test_sequential_fleets_differ():
    fleets = layouts.sequential(RULES, 100, torch.Generator().manual_seed(1))

    assert len({tuple(fleet.tolist()) for fleet in fleets}) == 100


def test_fleets_survive_writing_and_reading(tmp_path):
    fleets = layouts.sequential(RULES, 20, torch.Generator().manual_seed(1))

    layouts.write(fleets, tmp_path / "fleets.txt")

    assert torch.equal(layouts.read(tmp_path / "fleets.txt", "cpu"), fleets)


def test_reads_a_ship_as_size_direction_x_y(tmp_path):
    (tmp_path / "fleet.txt").write_text("2h01 5v90 4h03 4h05 3h07 3h09 3h49 2h31 2h65 2h61\n")

    fleet = layouts.read(tmp_path / "fleet.txt", "cpu")[0]

    assert fleet[0] == placement(5, VERTICAL, x=9, y=0)
    assert fleet[-1] == placement(2, HORIZONTAL, x=6, y=1)
    assert is_legal(fleet)
