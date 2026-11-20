from fathom_neural import sources
from fathom_neural.train import PLACER_FILE, SHOOTER_FILE, Settings, train

# Small enough for a CPU: a few fleets, a few steps.
TINY = Settings(fleets=32, replay=4096, batch=64, steps=1, snapshot_every=1, report_every=1)


def test_trains_a_shooter_and_a_placer_and_then_an_answer_to_the_placer(tmp_path):
    league = tmp_path / "league"
    answer = tmp_path / "answer"

    train(league, iterations=3, with_placer=True, device="cpu", settings=TINY)
    placer = sources.PLACER_PREFIX + str(league / PLACER_FILE)
    train(
        answer,
        iterations=2,
        layouts=placer,
        shooter_checkpoint=league / SHOOTER_FILE,
        device="cpu",
        settings=TINY,
    )

    assert (league / SHOOTER_FILE).exists() and (league / PLACER_FILE).exists()
    assert (answer / SHOOTER_FILE).exists() and not (answer / PLACER_FILE).exists()
