"""Where fleets come from: a name on the command line turned into a function that draws them."""

from collections.abc import Callable
from pathlib import Path

import torch
from torch import Tensor

from fathom_neural import layouts
from fathom_neural.placer import Placer
from fathom_neural.rules import Rules

Source = Callable[[int], Tensor]

SEQUENTIAL = "sequential"
PLACER_PREFIX = "placer:"


def sequential(rules: Rules, generator: torch.Generator) -> Source:
    return lambda count: layouts.sequential(rules, count, generator)


def from_placer(rules: Rules, placer: Placer, generator: torch.Generator) -> Source:
    """Fleets of a placer that is no longer trained. A fleet that hit a dead end is drawn again."""

    @torch.no_grad()
    def draw(count: int) -> Tensor:
        fleets = []
        missing = count
        while missing > 0:
            drawn = placer.draw(rules, missing, generator)
            fleets.append(drawn.fleets[drawn.complete])
            missing -= len(fleets[-1])
        return torch.cat(fleets)

    return draw


def from_file(rules: Rules, path: Path, generator: torch.Generator) -> Source:
    fleets = layouts.read(path, rules.cells.device)
    return lambda count: fleets[
        torch.randint(len(fleets), (count,), generator=generator, device=fleets.device)
    ]


def named(name: str, rules: Rules, generator: torch.Generator) -> Source:
    """`sequential`, `placer:<checkpoint>` or the path of a file of fleets."""
    if name == SEQUENTIAL:
        return sequential(rules, generator)
    if name.startswith(PLACER_PREFIX):
        return from_placer(rules, load_placer(Path(name.removeprefix(PLACER_PREFIX)), rules), generator)
    return from_file(rules, Path(name), generator)


def load_placer(path: Path, rules: Rules) -> Placer:
    placer = Placer().to(rules.cells.device)
    placer.load_state_dict(torch.load(path, map_location=rules.cells.device))
    return placer
