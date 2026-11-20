package io.github.snems.fathom.bot

import io.github.snems.fathom.SampleFleets.ship
import io.github.snems.fathom.board.Board
import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.github.snems.fathom.board.cells
import io.github.snems.fathom.board.edgeNeighbours
import io.kotest.matchers.collections.shouldContainExactlyInAnyOrder
import io.kotest.matchers.doubles.shouldBeGreaterThan
import io.kotest.matchers.shouldBe
import jd.mg.ships.tournament.api.Direction.HORIZONTAL
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement
import jd.mg.ships.tournament.api.Shot
import jd.mg.ships.tournament.api.ShotResult
import jd.mg.ships.tournament.api.ShotResult.HIT
import jd.mg.ships.tournament.api.ShotResult.MISS
import jd.mg.ships.tournament.api.ShotResult.SUNK
import org.junit.jupiter.api.Test

class PlacementDensityTest {
    private val waters = EnemyWaters()
    private val density = PlacementDensity(waters)

    @Test
    fun shouldCountEveryPlacementOnAnEmptyBoard() {
        // when
        val weights = density.weights()

        // then
        weights[Position(0, 0).index()] shouldBe CORNER_PLACEMENTS
        weights.all { it > 0 } shouldBe true
    }

    @Test
    fun shouldGiveNoWeightToAMiss() {
        // given
        record(Position(4, 4), MISS)

        // when
        val weights = density.weights()

        // then
        weights[Position(4, 4).index()] shouldBe 0.0
        weights[Position(4, 5).index()] shouldBeGreaterThan 0.0
    }

    @Test
    fun shouldGiveNoWeightToASunkShipOrTheCellsNextToIt() {
        // given
        val sunk = ship(2, 4, 4, HORIZONTAL)
        record(Position(4, 4), HIT)
        record(Position(5, 4), SUNK, sunk)

        // when
        val weights = density.weights()

        // then
        (sunk.cells() + sunk.edgeNeighbours()).forEach { weights[it.index()] shouldBe 0.0 }
        weights[Position(3, 3).index()] shouldBeGreaterThan 0.0
    }

    @Test
    fun shouldStopCountingASizeOnceItsLastShipIsSunk() {
        // given
        val carrier = ship(5, 0, 0, HORIZONTAL)
        val before = density.weights()[FAR_CORNER.index()]

        // when
        carrier.cells().dropLast(1).forEach { record(it, HIT) }
        record(carrier.cells().last(), SUNK, carrier)

        // then
        waters.afloat shouldBe listOf(4, 4, 3, 3, 3, 2, 2, 2, 2)
        density.weights()[FAR_CORNER.index()] shouldBe before - CARRIER_PLACEMENTS_IN_A_CORNER
    }

    @Test
    fun shouldWeighOnlyTheNeighboursOfASingleHit() {
        // given
        record(Position(4, 4), HIT)

        // when
        val weights = density.weights()

        // then
        positive(weights) shouldContainExactlyInAnyOrder
            listOf(
                Position(0, 4),
                Position(1, 4),
                Position(2, 4),
                Position(3, 4),
                Position(5, 4),
                Position(6, 4),
                Position(7, 4),
                Position(8, 4),
                Position(4, 0),
                Position(4, 1),
                Position(4, 2),
                Position(4, 3),
                Position(4, 5),
                Position(4, 6),
                Position(4, 7),
                Position(4, 8),
            )
    }

    @Test
    fun shouldWeighOnlyTheLineThroughTwoHits() {
        // given
        record(Position(4, 4), HIT)
        record(Position(5, 4), HIT)

        // when
        val weights = density.weights()

        // then
        positive(weights) shouldContainExactlyInAnyOrder
            listOf(Position(1, 4), Position(2, 4), Position(3, 4), Position(6, 4), Position(7, 4), Position(8, 4))
    }

    @Test
    fun shouldCountEveryPlacementAgainWhenNoneFitsTheHits() {
        // given
        val sunkWithoutShip = Position(4, 4)
        record(sunkWithoutShip, SUNK)
        sunkWithoutShip.edgeNeighbours().forEach { record(it, MISS) }

        // when
        val weights = density.weights()

        // then
        weights[sunkWithoutShip.index()] shouldBe 0.0
        weights[FAR_CORNER.index()] shouldBeGreaterThan 0.0
    }

    @Test
    fun shouldTakeASinkingWithoutTheShipAsAHit() {
        // when
        record(Position(4, 4), SUNK)

        // then
        waters.isOpenHit(Position(4, 4).index()) shouldBe true
        waters.afloat shouldBe FLEET_SHIP_SIZES
    }

    @Test
    fun shouldTakeASinkingReportedTwiceAsOne() {
        // given
        val sunk = ship(2, 4, 4, HORIZONTAL)
        record(Position(4, 4), HIT)

        // when
        repeat(2) { record(Position(5, 4), SUNK, sunk) }

        // then
        waters.afloat shouldBe FLEET_SHIP_SIZES - sunk.size
    }

    private fun record(
        position: Position,
        result: ShotResult,
        sunkShip: ShipPlacement? = null,
    ) = waters.record(Shot(position, result, sunkShip))

    private fun positive(weights: DoubleArray): List<Position> = Board.positions.filter { weights[it.index()] > 0 }

    private companion object {
        val FAR_CORNER = Position(9, 9)

        /** One horizontal and one vertical placement for each of the ten ships of the fleet. */
        const val CORNER_PLACEMENTS = 20.0

        /** One horizontal and one vertical placement of the 5-cell ship. */
        const val CARRIER_PLACEMENTS_IN_A_CORNER = 2.0
    }
}
