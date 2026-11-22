package io.github.snems.fathom.arena.shooters

import io.github.snems.fathom.arena.ShootingRange
import io.github.snems.fathom.arena.layouts.SequentialLayouts
import io.github.snems.fathom.board.Board
import io.github.snems.fathom.bot.FathomBot
import io.github.snems.fathom.game.FleetUnderFire
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.Shot
import org.junit.jupiter.api.Test
import kotlin.random.Random
import kotlin.time.Duration

class FathomShooterTest {
    private val fleet = ShootingRange.fleetOf(SequentialLayouts(shuffled = false).layout(Random(FLEET_SEED)))

    @Test
    fun shouldShootAsTheBotShootsWhenNobodyWatchesIt() {
        // given
        val bot = FathomBot(Random(SEED), timeBudget = Duration.INFINITE)
        val shooter = FathomShooter(Random(SEED))

        // when
        val unwatched = sink(bot::chooseShot, bot::onShotResult)
        val watched = sink(shooter::chooseShot, shooter::onShotResult)

        // then
        watched shouldBe unwatched
    }

    @Test
    fun shouldKeepTheWeightsOfItsLastShot() {
        // given
        val shooter = FathomShooter(Random(SEED))
        val before = shooter.weightsOfLastShot()

        // when
        val shot = shooter.chooseShot(Board.positions)

        // then: the shot went to a cell no other cell outweighs
        val weights = checkNotNull(shooter.weightsOfLastShot())
        before shouldBe null
        weights.size shouldBe Board.positions.size
        weights[Board.positions.indexOf(shot)] shouldBe weights.max()
        weights.max() shouldNotBe 0.0
    }

    private fun sink(
        choose: (List<Position>) -> Position,
        tell: (Shot) -> Unit,
    ): List<Shot> {
        val target = FleetUnderFire(fleet)
        val shots = mutableListOf<Shot>()
        while (!target.isSunk) {
            shots += target.receive(choose(target.unshot())).also(tell)
        }
        return shots
    }

    private companion object {
        const val SEED = 3
        const val FLEET_SEED = 8
    }
}
