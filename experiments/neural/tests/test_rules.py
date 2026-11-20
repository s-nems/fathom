import torch

from fathom_neural.rules import HORIZONTAL, VERTICAL, Rules, cell, placement

RULES = Rules.on("cpu")


def test_counts_the_placements_that_fit_the_board():
    # 10 lines of 6, 7, 8 and 9 positions for sizes 5, 4, 3 and 2, in two directions.
    assert int(RULES.on_board.sum()) == 2 * 10 * (6 + 7 + 8 + 9)


def test_ship_covers_its_cells_in_its_direction():
    across = RULES.cells[placement(3, HORIZONTAL, x=2, y=5)]
    down = RULES.cells[placement(3, VERTICAL, x=2, y=5)]

    assert across.nonzero().flatten().tolist() == [cell(2, 5), cell(3, 5), cell(4, 5)]
    assert down.nonzero().flatten().tolist() == [cell(2, 5), cell(2, 6), cell(2, 7)]


def test_ship_claims_the_cells_sharing_an_edge_but_not_the_corners():
    claim = RULES.claim[placement(2, HORIZONTAL, x=0, y=0)]

    assert claim.nonzero().flatten().tolist() == [cell(0, 0), cell(1, 0), cell(2, 0), cell(0, 1), cell(1, 1)]


def test_ship_running_off_the_board_has_no_cells():
    off = placement(5, HORIZONTAL, x=6, y=0)

    assert not RULES.on_board[off]
    assert torch.count_nonzero(RULES.cells[off]) == 0
