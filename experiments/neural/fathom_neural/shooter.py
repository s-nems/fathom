"""A network that reads what a shooter knows and says how likely each cell is to hold a ship."""

from collections.abc import Callable

import torch
from torch import Tensor, nn

from fathom_neural.game import PLANES, Knowledge, Range
from fathom_neural.rules import CELLS, Rules

CHANNELS = 64
BLOCKS = 6

Policy = Callable[[Knowledge], Tensor]
Recorder = Callable[[Knowledge, Tensor], None]


Norm = Callable[[int], nn.Module]


class Block(nn.Module):
    def __init__(self, channels: int, norm: Norm):
        super().__init__()
        self.body = nn.Sequential(
            nn.Conv2d(channels, channels, 3, padding=1, bias=False),
            norm(channels),
            nn.ReLU(),
            nn.Conv2d(channels, channels, 3, padding=1, bias=False),
            norm(channels),
        )

    def forward(self, x: Tensor) -> Tensor:
        return torch.relu(x + self.body(x))


class Tower(nn.Module):
    """A residual tower over the board with `outputs` values per cell."""

    def __init__(
        self,
        planes: int,
        outputs: int,
        channels: int = CHANNELS,
        blocks: int = BLOCKS,
        norm: Norm = nn.BatchNorm2d,
    ):
        super().__init__()
        self.body = nn.Sequential(
            nn.Conv2d(planes, channels, 3, padding=1, bias=False),
            norm(channels),
            nn.ReLU(),
            *(Block(channels, norm) for _ in range(blocks)),
            nn.Conv2d(channels, outputs, 1),
        )

    def forward(self, x: Tensor) -> Tensor:
        # Half precision and channels-last memory are about twice as fast on a GPU.
        with torch.autocast(x.device.type, dtype=torch.bfloat16, enabled=x.is_cuda):
            values = self.body(x.contiguous(memory_format=torch.channels_last))
        return values.flatten(start_dim=1).float()


class Shooter(nn.Module):
    """Logits of a ship on each cell, [B, CELLS]."""

    def __init__(self):
        super().__init__()
        self.tower = Tower(PLANES, outputs=1)

    def forward(self, observation: Tensor) -> Tensor:
        return self.tower(observation)


def greedy(shooter: Shooter) -> Policy:
    """Shoots at the open cell most likely to hold a ship."""

    def choose(knowledge: Knowledge) -> Tensor:
        return shooter(knowledge.observation).masked_fill(~knowledge.open, -torch.inf).argmax(dim=1)

    return choose


def exploring(policy: Policy, chance: float, generator: torch.Generator) -> Policy:
    """Follows `policy`, but with `chance` shoots at a random open cell."""

    def choose(knowledge: Knowledge) -> Tensor:
        # A finished game has no open cell. Its shot is ignored, so any cell will do.
        weights = knowledge.open.float() + knowledge.done[:, None]
        anywhere = torch.multinomial(weights, 1, generator=generator).squeeze(1)
        explore = torch.rand(len(anywhere), generator=generator, device=anywhere.device) < chance
        return torch.where(explore, anywhere, policy(knowledge))

    return choose


@torch.no_grad()
def shots_to_sink(rules: Rules, fleets: Tensor, policy: Policy, record: Recorder | None = None) -> Tensor:
    """Plays every fleet to the end and returns the shots each took, [B]."""
    shooting_range = Range(rules, fleets)
    for _ in range(CELLS):
        knowledge = shooting_range.knowledge()
        if knowledge.done.all():
            break
        if record is not None:
            record(knowledge, shooting_range.occupied)
        shooting_range.shoot(policy(knowledge), ~knowledge.done)
    return shooting_range.shots
