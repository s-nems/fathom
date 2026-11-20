"""The board, the fleet and every way to put a ship on the board, as tensors."""

from dataclasses import dataclass

import torch
from torch import Tensor

BOARD = 10
CELLS = BOARD * BOARD
FLEET = (5, 4, 4, 3, 3, 3, 2, 2, 2, 2)
SHIP_SIZES = tuple(sorted(set(FLEET), reverse=True))
HORIZONTAL, VERTICAL = 0, 1
DIRECTIONS = 2

# A slot is a direction and the cell of the ship closest to the origin. Every size has the same slots,
# and the slots that would run off the board are marked as such. That keeps one index for all sizes.
SLOTS = DIRECTIONS * CELLS
PLACEMENTS = len(SHIP_SIZES) * SLOTS


def cell(x: int, y: int) -> int:
    return y * BOARD + x


def placement(size: int, direction: int, x: int, y: int) -> int:
    return SHIP_SIZES.index(size) * SLOTS + direction * CELLS + cell(x, y)


@dataclass(frozen=True)
class Rules:
    """Lookup tables indexed by placement. A row of a placement that runs off the board is empty."""

    on_board: Tensor  # [PLACEMENTS] bool
    size: Tensor  # [PLACEMENTS] int
    cells: Tensor  # [PLACEMENTS, CELLS] float, 1 on the cells of the ship
    claim: Tensor  # [PLACEMENTS, CELLS] float, 1 on the cells of the ship and those sharing an edge with it
    fleet: Tensor  # [len(FLEET)] int, the sizes in the order ships are placed
    fleet_slots: Tensor  # [len(FLEET)] int, the first placement index of each ship's size

    @staticmethod
    def on(device: torch.device | str) -> "Rules":
        on_board = torch.zeros(PLACEMENTS, dtype=torch.bool)
        size = torch.zeros(PLACEMENTS, dtype=torch.long)
        cells = torch.zeros(PLACEMENTS, CELLS)
        claim = torch.zeros(PLACEMENTS, CELLS)
        for ship in SHIP_SIZES:
            for direction in (HORIZONTAL, VERTICAL):
                for y in range(BOARD):
                    for x in range(BOARD):
                        index = placement(ship, direction, x, y)
                        size[index] = ship
                        covered = _cells_of(ship, direction, x, y)
                        if covered is None:
                            continue
                        on_board[index] = True
                        cells[index, covered] = 1
                        claim[index, sorted(_with_edge_neighbours(covered))] = 1
        fleet = torch.tensor(FLEET)
        fleet_slots = torch.tensor([SHIP_SIZES.index(ship) * SLOTS for ship in FLEET])
        return Rules(*(table.to(device) for table in (on_board, size, cells, claim, fleet, fleet_slots)))


def _cells_of(size: int, direction: int, x: int, y: int) -> list[int] | None:
    dx, dy = (1, 0) if direction == HORIZONTAL else (0, 1)
    end_x, end_y = x + dx * (size - 1), y + dy * (size - 1)
    if end_x >= BOARD or end_y >= BOARD:
        return None
    return [cell(x + dx * step, y + dy * step) for step in range(size)]


def _with_edge_neighbours(cells: list[int]) -> set[int]:
    claimed = set(cells)
    for index in cells:
        x, y = index % BOARD, index // BOARD
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < BOARD and 0 <= ny < BOARD:
                claimed.add(cell(nx, ny))
    return claimed
