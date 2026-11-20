package io.github.snems.fathom.bot

import io.github.snems.fathom.SampleFleets.ship
import io.github.snems.fathom.board.Board
import io.github.snems.fathom.board.cells
import io.github.snems.fathom.board.edgeNeighbours
import io.kotest.matchers.collections.shouldContainExactlyInAnyOrder
import io.kotest.matchers.ints.shouldBeGreaterThan
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
import kotlin.random.Random

class ShotWeightsTest {
    private val waters = EnemyWaters()
    private val picker = ShotPicker(waters, Random(SEED))

    @Test
    fun shouldCountEveryPlacementOnAnEmptyBoard() {
        // when
        val weights = picker.weights()

        // then
        weights[Position(0, 0).index()] shouldBe CORNER_PLACEMENTS
        weights.all { it > 0 } shouldBe true
    }

    @Test
    fun shouldGiveNoWeightToAMiss() {
        // given
        record(Position(4, 4), MISS)

        // when
        val weights = picker.weights()

        // then
        weights[Position(4, 4).index()] shouldBe 0
        weights[Position(4, 5).index()] shouldBeGreaterThan 0
    }

    @Test
    fun shouldGiveNoWeightToASunkShipOrTheCellsNextToIt() {
        // given
        val sunk = ship(2, 4, 4, HORIZONTAL)
        record(Position(4, 4), HIT)
        record(Position(5, 4), SUNK, sunk)

        // when
        val weights = picker.weights()

        // then
        (sunk.cells() + sunk.edgeNeighbours()).forEach { weights[it.index()] shouldBe 0 }
        weights[Position(3, 3).index()] shouldBeGreaterThan 0
    }

    @Test
    fun shouldStopCountingASizeOnceItsLastShipIsSunk() {
        // given
        val carrier = ship(5, 0, 0, HORIZONTAL)
        val before = picker.weights()[FAR_CORNER.index()]

        // when
        carrier.cells().dropLast(1).forEach { record(it, HIT) }
        record(carrier.cells().last(), SUNK, carrier)

        // then
        waters.afloat shouldBe listOf(4, 4, 3, 3, 3, 2, 2, 2, 2)
        picker.weights()[FAR_CORNER.index()] shouldBe before - CARRIER_PLACEMENTS_IN_A_CORNER
    }

    @Test
    fun shouldWeighOnlyTheNeighboursOfASingleHit() {
        // given
        record(Position(4, 4), HIT)

        // when
        val weights = picker.weights()

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
        val weights = picker.weights()

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
        val weights = picker.weights()

        // then
        weights[sunkWithoutShip.index()] shouldBe 0
        weights[FAR_CORNER.index()] shouldBeGreaterThan 0
    }

    @Test
    fun shouldPickTheHeaviestOfferedCell() {
        // given
        record(Position(4, 4), HIT)
        record(Position(5, 4), HIT)
        val offered = listOf(Position(0, 0), Position(6, 4), Position(9, 9))

        // when
        val shot = picker.pick(offered)

        // then
        shot shouldBe Position(6, 4)
    }

    @Test
    fun shouldBreakTiesAtRandom() {
        // when
        val firstShots = List(PICKERS) { seed -> ShotPicker(EnemyWaters(), Random(seed)).pick(Board.positions) }

        // then
        firstShots.distinct().size shouldBeGreaterThan 1
    }

    private fun record(
        position: Position,
        result: ShotResult,
        sunkShip: ShipPlacement? = null,
    ) = waters.record(Shot(position, result, sunkShip))

    private fun positive(weights: IntArray): List<Position> = Board.positions.filter { weights[it.index()] > 0 }

    private companion object {
        const val SEED = 7
        const val PICKERS = 20
        val FAR_CORNER = Position(9, 9)

        /** One horizontal and one vertical placement for each of the ten ships of the fleet. */
        const val CORNER_PLACEMENTS = 20

        /** One horizontal and one vertical placement of the 5-cell ship. */
        const val CARRIER_PLACEMENTS_IN_A_CORNER = 2
    }
}
