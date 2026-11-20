"""Checks shared by the tests."""

import torch

from fathom_neural.rules import FLEET, Rules

RULES = Rules.on("cpu")


def is_legal(fleet: torch.Tensor) -> bool:
    """Every ship is on the board and no ship lies on a cell another one claims."""
    if not RULES.on_board[fleet].all() or RULES.size[fleet].tolist() != list(FLEET):
        return False
    cells, claim = RULES.cells[fleet], RULES.claim[fleet]
    overlap = cells @ claim.T
    return bool((overlap - torch.diag(torch.diag(overlap)) == 0).all())
