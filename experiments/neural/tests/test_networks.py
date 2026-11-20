import torch

from fathom_neural import layouts
from fathom_neural.evaluate import win_share
from fathom_neural.placer import Placer
from fathom_neural.rules import CELLS, Rules
from fathom_neural.shooter import Shooter, exploring, greedy, shots_to_sink
from tests.fleets import is_legal

RULES = Rules.on("cpu")


def test_untrained_shooter_sinks_every_fleet_with_legal_shots():
    generator = torch.Generator().manual_seed(1)
    fleets = layouts.sequential(RULES, 16, generator)
    shooter = Shooter().eval()

    shots = shots_to_sink(RULES, fleets, exploring(greedy(shooter), 0.5, generator))

    # 30 ship cells at least, and never a cell twice.
    assert ((shots >= 30) & (shots <= CELLS)).all()


def test_placer_draws_legal_fleets_and_knows_their_chance():
    drawn = Placer().draw(RULES, 64, torch.Generator().manual_seed(1))

    assert drawn.complete.any()
    assert all(is_legal(fleet) for fleet in drawn.fleets[drawn.complete])
    assert torch.isfinite(drawn.log_chance).all() and (drawn.log_chance < 0).all()
    assert (drawn.entropy > 0).all()


def test_win_share_counts_a_tie_as_half_a_win():
    assert win_share(torch.tensor([40, 50]), torch.tensor([50, 60])) == (1 + 1 + 0.5 + 1) / 4
