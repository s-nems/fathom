package io.github.snems.fathom.bot

import io.github.snems.fathom.SampleFleets.ship
import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.kotest.matchers.shouldBe
import jd.mg.ships.tournament.api.Direction.HORIZONTAL
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.Shot
import jd.mg.ships.tournament.api.ShotResult.HIT
import jd.mg.ships.tournament.api.ShotResult.SUNK
import org.junit.jupiter.api.Test

class EnemyWatersTest {
    private val waters = EnemyWaters()

    @Test
    fun shouldTakeASinkingWithoutTheShipAsAHit() {
        // when
        waters.record(Shot(Position(4, 4), SUNK))

        // then
        waters.isOpenHit(Position(4, 4).index()) shouldBe true
        waters.afloat shouldBe FLEET_SHIP_SIZES
    }

    @Test
    fun shouldTakeASinkingReportedTwiceAsOne() {
        // given
        val sunk = ship(2, 4, 4, HORIZONTAL)
        waters.record(Shot(Position(4, 4), HIT))

        // when
        repeat(2) { waters.record(Shot(Position(5, 4), SUNK, sunk)) }

        // then
        waters.afloat shouldBe FLEET_SHIP_SIZES - sunk.size
        waters.sunk.map { it.ship } shouldBe listOf(sunk)
    }
}
