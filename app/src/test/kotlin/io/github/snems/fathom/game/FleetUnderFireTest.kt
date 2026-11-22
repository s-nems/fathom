package io.github.snems.fathom.game

import io.github.snems.fathom.SampleFleets.COMPLETE
import io.github.snems.fathom.board.Board
import io.github.snems.fathom.board.cells
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.collections.shouldContainExactly
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.collections.shouldNotContain
import io.kotest.matchers.shouldBe
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.Shot
import jd.mg.ships.tournament.api.ShotResult.HIT
import jd.mg.ships.tournament.api.ShotResult.MISS
import jd.mg.ships.tournament.api.ShotResult.SUNK
import org.junit.jupiter.api.Test

class FleetUnderFireTest {
    private val destroyer = COMPLETE.last()
    private val target = FleetUnderFire(COMPLETE.fold(Fleet.EMPTY, Fleet::place))

    @Test
    fun shouldAnswerMissInOpenWater() {
        // when
        val shot = target.receive(OPEN_WATER)

        // then
        shot shouldBe Shot(OPEN_WATER, MISS)
    }

    @Test
    fun shouldAnswerHitThenSunkWithTheShip() {
        // given
        val (first, second) = destroyer.cells()

        // when
        val shots = listOf(target.receive(first), target.receive(second))

        // then
        shots shouldContainExactly listOf(Shot(first, HIT), Shot(second, SUNK, destroyer))
    }

    @Test
    fun shouldNotOfferCellAlreadyShotAt() {
        // when
        target.receive(OPEN_WATER)

        // then
        target.accepts(OPEN_WATER) shouldBe false
        target.unshot() shouldHaveSize Board.positions.size - 1
        target.unshot() shouldNotContain OPEN_WATER
    }

    @Test
    fun shouldNotAcceptShotOffTheBoard() {
        // when
        val accepted = target.accepts(Position(Board.SIZE, 0))

        // then
        accepted shouldBe false
    }

    @Test
    fun shouldThrowOnShotItDoesNotAccept() {
        // given
        target.receive(OPEN_WATER)

        // when, then
        shouldThrow<IllegalArgumentException> { target.receive(OPEN_WATER) }
    }

    @Test
    fun shouldBeSunkOnlyWhenEveryShipCellIsHit() {
        // given
        val cells = COMPLETE.flatMap { it.cells() }

        // when
        cells.dropLast(1).forEach(target::receive)
        val beforeLastHit = target.isSunk
        target.receive(cells.last())

        // then
        beforeLastHit shouldBe false
        target.isSunk shouldBe true
    }

    private companion object {
        val OPEN_WATER = Position(5, 0)
    }
}
