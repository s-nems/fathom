"""Many fleets under fire at once, and what a shooter knows about each."""

from dataclasses import dataclass

import torch
from torch import Tensor

from fathom_neural.rules import BOARD, CELLS, SHIP_SIZES, Rules

# Planes of an observation: three kinds of cell the shooter has seen, the cells the rules show to be
# empty, then one plane per ship size holding the share of ships of that size still afloat.
MISS, OPEN_HIT, SUNK, NEXT_TO_SUNK = range(4)
FIRST_AFLOAT_PLANE = 4
PLANES = FIRST_AFLOAT_PLANE + len(SHIP_SIZES)


@dataclass(frozen=True)
class Knowledge:
    """What the shooters know before a shot."""

    observation: Tensor  # [B, PLANES, BOARD, BOARD] float
    open: Tensor  # [B, CELLS] bool, cells worth a shot: not shot at and not shown to be empty
    done: Tensor  # [B] bool, every ship is sunk


class Range:
    """A batch of fleets, each shot at by its own shooter until every ship is sunk."""

    def __init__(self, rules: Rules, fleets: Tensor):
        self._ship_cells = rules.cells[fleets]  # [B, ships, CELLS]
        self._ship_claim = rules.claim[fleets]
        self._ship_size = rules.size[fleets]  # [B, ships]
        self._ships_of_size = torch.stack([(rules.fleet == size).sum() for size in SHIP_SIZES])
        self.occupied = self._ship_cells.sum(dim=1) > 0  # [B, CELLS]
        self.shot = torch.zeros_like(self.occupied)
        self.shots = torch.zeros(len(fleets), dtype=torch.long, device=fleets.device)

    def knowledge(self) -> Knowledge:
        hits = (self._ship_cells * self.shot[:, None, :]).sum(dim=2)
        sunk_ships = hits == self._ship_size
        sunk = (self._ship_cells * sunk_ships[:, :, None]).sum(dim=1) > 0
        next_to_sunk = ((self._ship_claim * sunk_ships[:, :, None]).sum(dim=1) > 0) & ~sunk
        hit = self.shot & self.occupied
        board = torch.stack([self.shot & ~hit, hit & ~sunk, sunk, next_to_sunk], dim=1).float()
        afloat = torch.stack(
            [((self._ship_size == size) & ~sunk_ships).sum(dim=1) for size in SHIP_SIZES], dim=1
        )
        afloat_planes = (afloat / self._ships_of_size)[:, :, None].expand(-1, -1, CELLS)
        observation = torch.cat([board, afloat_planes], dim=1).view(-1, PLANES, BOARD, BOARD)
        return Knowledge(observation, ~self.shot & ~next_to_sunk, sunk_ships.all(dim=1))

    def shoot(self, cells: Tensor, playing: Tensor) -> None:
        """Fires one shot at each fleet marked in `playing`. Both are [B]."""
        self.shot[playing, cells[playing]] = True
        self.shots += playing
