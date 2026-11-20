"""Fleets as rows of placement indices: drawing them at random, and reading and writing them as text."""

from pathlib import Path

import torch
from torch import Tensor

from fathom_neural.rules import BOARD, CELLS, FLEET, HORIZONTAL, SHIP_SIZES, SLOTS, VERTICAL, Rules, placement

_DIRECTION_LETTERS = {"h": HORIZONTAL, "v": VERTICAL}


def free_placements(rules: Rules, taken: Tensor, ship: int) -> Tensor:
    """For each board, which slots the ship number `ship` of the fleet may take. `taken` is [B, CELLS]."""
    first = int(rules.fleet_slots[ship])
    slots = slice(first, first + SLOTS)
    overlap = taken @ rules.cells[slots].T
    return rules.on_board[slots] & (overlap == 0)


def sequential(rules: Rules, count: int, generator: torch.Generator) -> Tensor:
    """Fleets placed ship after ship, largest first, each at random among the placements still free."""
    fleets = torch.zeros(count, len(FLEET), dtype=torch.long, device=rules.cells.device)
    todo = torch.arange(count, device=fleets.device)
    while len(todo) > 0:
        drawn, complete = _sequential_once(rules, len(todo), generator)
        fleets[todo[complete]] = drawn[complete]
        todo = todo[~complete]
    return fleets


def _sequential_once(rules: Rules, count: int, generator: torch.Generator) -> tuple[Tensor, Tensor]:
    device = rules.cells.device
    fleets = torch.zeros(count, len(FLEET), dtype=torch.long, device=device)
    taken = torch.zeros(count, CELLS, device=device)
    complete = torch.ones(count, dtype=torch.bool, device=device)
    for ship in range(len(FLEET)):
        free = free_placements(rules, taken, ship)
        complete &= free.any(dim=1)
        # A board in a dead end draws from all slots. It is thrown away afterwards.
        weights = torch.where(complete[:, None], free.float(), torch.ones_like(free, dtype=torch.float))
        chosen = torch.multinomial(weights, 1, generator=generator).squeeze(1) + rules.fleet_slots[ship]
        fleets[:, ship] = chosen
        taken = torch.maximum(taken, rules.claim[chosen])
    return fleets, complete


def write(fleets: Tensor, path: Path) -> None:
    """One fleet per line, a ship as size, direction letter, x and y, such as `5h23`."""
    letters = {direction: letter for letter, direction in _DIRECTION_LETTERS.items()}
    lines = []
    for fleet in fleets.tolist():
        ships = []
        for index in fleet:
            size, slot = SHIP_SIZES[index // SLOTS], index % SLOTS
            direction, at = slot // CELLS, slot % CELLS
            ships.append(f"{size}{letters[direction]}{at % BOARD}{at // BOARD}")
        lines.append(" ".join(ships))
    path.write_text("\n".join(lines) + "\n")


def read(path: Path, device: torch.device | str) -> Tensor:
    """Reads fleets written by `write` or by the arena of the Kotlin project."""
    fleets = []
    for line in path.read_text().splitlines():
        ships = sorted(line.split(), key=lambda ship: -int(ship[0]))
        fleets.append([placement(int(s[0]), _DIRECTION_LETTERS[s[1]], int(s[2]), int(s[3])) for s in ships])
    return torch.tensor(fleets, dtype=torch.long, device=device)
