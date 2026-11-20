"""Trains a shooter on fleets from a source, or a shooter and a placer against each other.

    python -m fathom_neural.train --out runs/sequential --iterations 3000
    python -m fathom_neural.train --out runs/league --shooter runs/sequential/shooter.pt --placer --iterations 6000
    python -m fathom_neural.train --out runs/answer --layouts placer:runs/league/placer.pt --iterations 3000

The shooter learns which cells hold a ship from positions of its own games and always shoots at the likeliest
open cell. The placer is rewarded with the number of shots the shooter needed. Against a placer the shooter
also meets fleets of earlier versions of the placer, so that it answers the placer's history, not only its
latest habit.
"""

import argparse
import copy
import random
from dataclasses import dataclass
from pathlib import Path

import torch
from torch import Tensor
from torch.nn import functional

from fathom_neural import sources
from fathom_neural.game import PLANES, Knowledge
from fathom_neural.placer import Drawn, Placer
from fathom_neural.rules import BOARD, CELLS, Rules
from fathom_neural.shooter import Shooter, exploring, greedy, shots_to_sink

SHOOTER_FILE = "shooter.pt"
PLACER_FILE = "placer.pt"
DEFAULT_DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Keeps the division defined when every fleet of a batch took the same number of shots.
SMALLEST_SPREAD = 1e-6


@dataclass(frozen=True)
class Settings:
    fleets: int = 4096  # fleets shot at in one iteration
    placer_share: float = 0.5  # of those, drawn by the placer being trained
    earlier_share: float = 0.25  # and by an earlier version of it. The rest come from the given source.
    snapshot_every: int = 100  # iterations between kept versions of the placer
    explore: float = 0.02  # chance of a random shot while collecting positions
    keep: float = 0.25  # share of positions of a game that go to the replay
    replay: int = 2_000_000  # positions remembered
    batch: int = 4096  # positions in one step of the shooter
    steps: int = 8  # steps of the shooter in one iteration
    shooter_rate: float = 1e-3
    placer_rate: float = 1e-4
    entropy_weight: float = 0.01  # keeps the placer from settling on a few fleets
    report_every: int = 50


class Replay:
    """The latest positions of the shooter's games, with the fleet that was hidden in each."""

    def __init__(self, capacity: int, device: torch.device, generator: torch.Generator):
        self._observation = torch.zeros(capacity, PLANES, BOARD, BOARD, dtype=torch.float16, device=device)
        self._occupied = torch.zeros(capacity, CELLS, dtype=torch.bool, device=device)
        self._open = torch.zeros(capacity, CELLS, dtype=torch.bool, device=device)
        self._generator = generator
        self._next = 0
        self.size = 0

    def add(self, knowledge: Knowledge, occupied: Tensor, keep: Tensor) -> None:
        capacity = len(self._occupied)
        at = (self._next + torch.arange(int(keep.sum()), device=keep.device)) % capacity
        self._observation[at] = knowledge.observation[keep].half()
        self._occupied[at] = occupied[keep]
        self._open[at] = knowledge.open[keep]
        self._next = (self._next + len(at)) % capacity
        self.size = min(self.size + len(at), capacity)

    def sample(self, count: int) -> tuple[Tensor, Tensor, Tensor]:
        at = torch.randint(self.size, (count,), generator=self._generator, device=self._occupied.device)
        return self._observation[at].float(), self._occupied[at].float(), self._open[at].float()


def train(
    out: Path,
    iterations: int,
    layouts: str = sources.SEQUENTIAL,
    with_placer: bool = False,
    shooter_checkpoint: Path | None = None,
    seed: int = 1,
    device: str = DEFAULT_DEVICE,
    settings: Settings = Settings(),
) -> None:
    generator = torch.Generator(device).manual_seed(seed)
    random.seed(seed)
    torch.manual_seed(seed)
    rules = Rules.on(device)
    out.mkdir(parents=True, exist_ok=True)

    shooter = Shooter().to(device)
    if shooter_checkpoint:
        shooter.load_state_dict(torch.load(shooter_checkpoint, map_location=device))
    shooter_optimiser = torch.optim.Adam(shooter.parameters(), settings.shooter_rate)
    placer = Placer().to(device) if with_placer else None
    placer_optimiser = torch.optim.Adam(placer.parameters(), settings.placer_rate) if placer else None
    earlier: list[Placer] = []
    given = sources.named(layouts, rules, generator)
    replay = Replay(settings.replay, torch.device(device), generator)

    def record(knowledge: Knowledge, occupied: Tensor) -> None:
        keep = torch.rand(len(occupied), generator=generator, device=device) < settings.keep
        replay.add(knowledge, occupied, keep & ~knowledge.done)

    for iteration in range(1, iterations + 1):
        drawn = (
            placer.draw(rules, int(settings.fleets * settings.placer_share), generator) if placer else None
        )
        fleets, from_given = _fleets(rules, settings, given, drawn, earlier, generator)

        shooter.eval()
        policy = exploring(greedy(shooter), settings.explore, generator)
        shots = shots_to_sink(rules, fleets, policy, record).float()
        report = f"{iteration:6d}  given {shots[-from_given:].mean():.2f}"

        if drawn is not None:
            report += _improve_placer(placer_optimiser, drawn, shots[: len(drawn.fleets)], settings)
            if iteration % settings.snapshot_every == 0:
                earlier.append(copy.deepcopy(placer))
        report += _improve_shooter(shooter, shooter_optimiser, replay, settings)

        if iteration % settings.report_every == 0 or iteration == iterations:
            print(report, flush=True)
            torch.save(shooter.state_dict(), out / SHOOTER_FILE)
            if placer:
                torch.save(placer.state_dict(), out / PLACER_FILE)


def _fleets(
    rules: Rules,
    settings: Settings,
    given: sources.Source,
    drawn: Drawn | None,
    earlier: list[Placer],
    generator: torch.Generator,
) -> tuple[Tensor, int]:
    """
    The fleets of one iteration: the placer's first, then an earlier version's, then the given source's.
    Also returns how many came from the given source.
    """
    parts = []
    if drawn is not None:
        # A fleet from a dead end is not legal. A fleet from the given source stands in for it.
        stand_in = given(len(drawn.fleets))
        parts.append(torch.where(drawn.complete[:, None], drawn.fleets, stand_in))
    if earlier:
        version = sources.from_placer(rules, random.choice(earlier), generator)
        parts.append(version(int(settings.fleets * settings.earlier_share)))
    from_given = settings.fleets - sum(len(part) for part in parts)
    parts.append(given(from_given))
    return torch.cat(parts), from_given


def _improve_placer(optimiser: torch.optim.Optimizer, drawn: Drawn, shots: Tensor, settings: Settings) -> str:
    """One step that makes fleets more likely the more shots they took. Returns a note for the report."""
    shots = shots[drawn.complete]
    advantage = (shots - shots.mean()) / (shots.std() + SMALLEST_SPREAD)
    gain = (
        advantage * drawn.log_chance[drawn.complete] + settings.entropy_weight * drawn.entropy[drawn.complete]
    )
    optimiser.zero_grad()
    (-gain.mean()).backward()
    optimiser.step()
    dead_ends = (~drawn.complete).float().mean()
    return f"  placer {shots.mean():.2f}  entropy {drawn.entropy.mean():.1f}  dead ends {dead_ends:.3f}"


def _improve_shooter(
    shooter: Shooter, optimiser: torch.optim.Optimizer, replay: Replay, settings: Settings
) -> str:
    """Steps that fit the shooter to remembered positions. Returns a note for the report."""
    shooter.train()
    loss = 0.0
    for _ in range(settings.steps):
        observation, occupied, open_cells = replay.sample(settings.batch)
        error = (
            functional.binary_cross_entropy_with_logits(
                shooter(observation), occupied, weight=open_cells, reduction="sum"
            )
            / open_cells.sum()
        )
        optimiser.zero_grad()
        error.backward()
        optimiser.step()
        loss += error.item() / settings.steps
    return f"  loss {loss:.4f}"


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--out", type=Path, required=True, help="directory for the checkpoints")
    parser.add_argument("--iterations", type=int, required=True)
    parser.add_argument(
        "--layouts", default=sources.SEQUENTIAL, help="sequential, placer:<checkpoint> or a file"
    )
    parser.add_argument("--placer", action="store_true", help="also train a placer against the shooter")
    parser.add_argument("--shooter", type=Path, help="checkpoint of a shooter to start from")
    parser.add_argument("--seed", type=int, default=1)
    parser.add_argument("--device", default=DEFAULT_DEVICE)
    args = parser.parse_args()
    train(args.out, args.iterations, args.layouts, args.placer, args.shooter, args.seed, args.device)


if __name__ == "__main__":
    main()
