"""Measures a shooter on fleets from a source, writes fleets of a source to a file, or compares two players.

python -m fathom_neural.evaluate shots --shooter runs/league/shooter.pt --layouts sequential
python -m fathom_neural.evaluate layouts --layouts placer:runs/league/placer.pt --out learned.txt
python -m fathom_neural.evaluate duel --mine net-on-their-fleets.shots --theirs they-on-net-fleets.shots
"""

import argparse
from pathlib import Path

import torch

from fathom_neural import layouts, sources
from fathom_neural.rules import Rules
from fathom_neural.shooter import Shooter, greedy, shots_to_sink

INTERVAL_95 = 1.96
# Not the default seed of training, so that evaluation does not start from the same random numbers.
EVALUATION_SEED = 2
CHUNK = 8192


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("what", choices=["shots", "layouts", "duel"])
    parser.add_argument(
        "--layouts", default=sources.SEQUENTIAL, help="sequential, placer:<checkpoint> or a file"
    )
    parser.add_argument("--shooter", help="checkpoint of the shooter")
    parser.add_argument("--games", type=int, default=10_000)
    parser.add_argument("--out", help="file for the fleets, or for the shots of each game")
    parser.add_argument("--mine", help="shots one player needed, a count per line")
    parser.add_argument("--theirs", help="shots the other player needed")
    parser.add_argument("--seed", type=int, default=EVALUATION_SEED)
    parser.add_argument("--device", default="cuda" if torch.cuda.is_available() else "cpu")
    args = parser.parse_args()

    if args.what == "duel":
        share = win_share(_shots(args.mine), _shots(args.theirs))
        print(f"{args.mine} wins {share:.1%} of games against {args.theirs}")
        return

    device = torch.device(args.device)
    generator = torch.Generator(device).manual_seed(args.seed)
    rules = Rules.on(device)
    source = sources.named(args.layouts, rules, generator)

    if args.what == "layouts":
        counts = [CHUNK] * (args.games // CHUNK) + [args.games % CHUNK]
        layouts.write(torch.cat([source(count) for count in counts if count > 0]), Path(args.out))
        return

    shooter = Shooter().to(device)
    shooter.load_state_dict(torch.load(args.shooter, map_location=device))
    shooter.eval()
    fleets = _all_or(args.games, args.layouts, rules, source)
    shots = torch.cat([shots_to_sink(rules, chunk, greedy(shooter)) for chunk in fleets.split(CHUNK)]).float()
    margin = INTERVAL_95 * shots.std().item() / len(shots) ** 0.5
    print(f"{args.layouts}: {shots.mean().item():.2f} ± {margin:.2f} shots over {len(shots)} fleets")
    if args.out:
        Path(args.out).write_text("\n".join(str(int(count)) for count in shots.tolist()) + "\n")


def win_share(mine: torch.Tensor, theirs: torch.Tensor) -> float:
    """Chance that a game of `mine` needs fewer shots than an independent game of `theirs`. A tie is half a win."""
    theirs = theirs.sort().values
    fewer = len(theirs) - torch.searchsorted(theirs, mine, right=True)
    equal = torch.searchsorted(theirs, mine, right=True) - torch.searchsorted(theirs, mine, right=False)
    return ((fewer + equal / 2).sum() / (len(mine) * len(theirs))).item()


def _shots(path: str) -> torch.Tensor:
    return torch.tensor([int(line) for line in Path(path).read_text().split()])


def _all_or(games: int, name: str, rules: Rules, source: sources.Source) -> torch.Tensor:
    """Every fleet of a file once, in order, or `games` fleets of another source."""
    if name == sources.SEQUENTIAL or name.startswith(sources.PLACER_PREFIX):
        return source(games)
    return layouts.read(Path(name), rules.cells.device)


if __name__ == "__main__":
    main()
