"""A network that lays out a fleet ship by ship."""

import functools
from dataclasses import dataclass

import torch
from torch import Tensor, nn

from fathom_neural import layouts
from fathom_neural.rules import BOARD, CELLS, DIRECTIONS, FLEET, SHIP_SIZES, Rules
from fathom_neural.shooter import Tower

# Planes the placer sees: its ships, the cells next to them, and one plane per size marking the next ship.
SHIPS, NEXT_TO_SHIPS = range(2)
FIRST_SIZE_PLANE = 2
PLANES = FIRST_SIZE_PLANE + len(SHIP_SIZES)
CHANNELS = 64
BLOCKS = 4
NORM_GROUPS = 8


@dataclass(frozen=True)
class Drawn:
    fleets: Tensor  # [B, ships] placement indices
    log_chance: Tensor  # [B] log of the chance the placer gave to the fleet it drew
    entropy: Tensor  # [B] entropy of its choices, summed over the ships
    complete: Tensor  # [B] bool, false when the placer ran into a dead end and the fleet is not legal


class Placer(nn.Module):
    """
    Normalises each board on its own, not across the batch. A placer is trained on the fleets it draws, so it
    has to draw the same way while it learns and afterwards, which normalising across the batch would break.
    """

    def __init__(self):
        super().__init__()
        norm = functools.partial(nn.GroupNorm, NORM_GROUPS)
        self.tower = Tower(PLANES, outputs=DIRECTIONS, channels=CHANNELS, blocks=BLOCKS, norm=norm)

    def draw(self, rules: Rules, count: int, generator: torch.Generator) -> Drawn:
        device = rules.cells.device
        fleets = torch.zeros(count, len(FLEET), dtype=torch.long, device=device)
        ships = torch.zeros(count, CELLS, device=device)
        taken = torch.zeros(count, CELLS, device=device)
        log_chance = torch.zeros(count, device=device)
        entropy = torch.zeros(count, device=device)
        complete = torch.ones(count, dtype=torch.bool, device=device)
        for ship, size in enumerate(FLEET):
            free = layouts.free_placements(rules, taken, ship)
            complete = complete & free.any(dim=1)
            # A board in a dead end may pick any slot. Its fleet is marked as not complete.
            free = free | ~complete[:, None]
            logits = self.tower(self._planes(ships, taken, size)).masked_fill(~free, -torch.inf)
            choices = torch.distributions.Categorical(logits=logits)
            slot = torch.multinomial(choices.probs, 1, generator=generator).squeeze(1)
            log_chance = log_chance + choices.log_prob(slot)
            entropy = entropy + choices.entropy()
            chosen = slot + rules.fleet_slots[ship]
            fleets[:, ship] = chosen
            ships = torch.maximum(ships, rules.cells[chosen])
            taken = torch.maximum(taken, rules.claim[chosen])
        return Drawn(fleets, log_chance, entropy, complete)

    @staticmethod
    def _planes(ships: Tensor, taken: Tensor, size: int) -> Tensor:
        next_size = torch.zeros(len(ships), len(SHIP_SIZES), CELLS, device=ships.device)
        next_size[:, SHIP_SIZES.index(size)] = 1
        board = torch.stack([ships, taken - ships], dim=1)
        return torch.cat([board, next_size], dim=1).view(-1, PLANES, BOARD, BOARD)
