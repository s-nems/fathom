package io.github.snems.fathom.board

import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.shouldBe
import jd.mg.ships.tournament.api.Position
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource

class BoardTest {
    @Test
    fun shouldListEveryCellRowByRow() {
        // when
        val positions = Board.positions

        // then
        positions shouldHaveSize CELLS
        positions.take(2) shouldBe listOf(Position(0, 0), Position(1, 0))
        positions.last() shouldBe Position(9, 9)
    }

    @ParameterizedTest(name = "({0},{1}) on board: {2}")
    @CsvSource("0, 0, true", "9, 9, true", "10, 0, false", "0, 10, false", "-1, 0, false", "0, -1, false")
    fun shouldTellWhetherCellIsOnTheBoard(
        x: Int,
        y: Int,
        expected: Boolean,
    ) {
        // when
        val onBoard = Position(x, y) in Board

        // then
        onBoard shouldBe expected
    }

    @ParameterizedTest(name = "size {0} fits in {1} ways")
    @CsvSource("5, 120", "4, 140", "3, 160", "2, 180")
    fun shouldListEveryPlacementOfShip(
        size: Int,
        expected: Int,
    ) {
        // when
        val placements = Board.placementsOf(size)

        // then
        placements shouldHaveSize expected
        placements.all { it.isOnBoard() } shouldBe true
    }

    private companion object {
        const val CELLS = 100
    }
}
