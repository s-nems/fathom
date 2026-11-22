package io.github.snems.fathom.board

import io.github.snems.fathom.SampleFleets.ship
import io.kotest.matchers.collections.shouldContainExactly
import io.kotest.matchers.collections.shouldContainExactlyInAnyOrder
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.shouldBe
import jd.mg.ships.tournament.api.Direction
import jd.mg.ships.tournament.api.Direction.HORIZONTAL
import jd.mg.ships.tournament.api.Direction.VERTICAL
import jd.mg.ships.tournament.api.Position
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource

class ShipGeometryTest {
    @Test
    fun shouldCoverCellsToTheRightWhenHorizontal() {
        // given
        val ship = ship(3, 4, 2, HORIZONTAL)

        // when
        val cells = ship.cells()

        // then
        cells shouldContainExactly listOf(Position(4, 2), Position(5, 2), Position(6, 2))
    }

    @Test
    fun shouldCoverCellsDownwardsWhenVertical() {
        // given
        val ship = ship(3, 4, 2, VERTICAL)

        // when
        val cells = ship.cells()

        // then
        cells shouldContainExactly listOf(Position(4, 2), Position(4, 3), Position(4, 4))
    }

    @Test
    fun shouldListCellsSharingAnEdgeWithCell() {
        // given
        val cell = Position(4, 2)

        // when
        val neighbours = cell.edgeNeighbours()

        // then
        neighbours shouldContainExactlyInAnyOrder listOf(Position(3, 2), Position(5, 2), Position(4, 1), Position(4, 3))
    }

    @Test
    fun shouldLeaveOutNeighboursOffTheBoard() {
        // given
        val corner = Position(0, 0)

        // when
        val neighbours = corner.edgeNeighbours()

        // then
        neighbours shouldContainExactlyInAnyOrder listOf(Position(1, 0), Position(0, 1))
    }

    @ParameterizedTest(name = "size {0} at ({1},{2}) {3} has {4} edge neighbours")
    @CsvSource(
        "3, 4, 4, HORIZONTAL, 8",
        "3, 4, 0, HORIZONTAL, 5",
        "3, 0, 0, HORIZONTAL, 4",
        "5, 2, 3, VERTICAL, 12",
        "5, 0, 2, VERTICAL, 7",
        "5, 9, 5, VERTICAL, 6",
    )
    fun shouldCountEdgeNeighboursOfShip(
        size: Int,
        x: Int,
        y: Int,
        direction: Direction,
        expected: Int,
    ) {
        // given
        val ship = ship(size, x, y, direction)

        // when
        val neighbours = ship.edgeNeighbours()

        // then
        neighbours shouldHaveSize expected
    }

    @Test
    fun shouldNotCountShipCellsOrCornersAsEdgeNeighbours() {
        // given
        val ship = ship(2, 4, 4, HORIZONTAL)

        // when
        val neighbours = ship.edgeNeighbours()

        // then
        neighbours shouldContainExactlyInAnyOrder
            listOf(Position(3, 4), Position(6, 4), Position(4, 3), Position(5, 3), Position(4, 5), Position(5, 5))
    }

    @Test
    fun shouldClaimCellsOfShipsAndCellsSharingAnEdgeWithThem() {
        // given
        val ships = listOf(ship(2, 0, 0, HORIZONTAL), ship(2, 2, 1, VERTICAL))

        // when
        val claimed = ships.claimedCells()

        // then
        claimed shouldContainExactlyInAnyOrder
            listOf(
                Position(0, 0),
                Position(1, 0),
                Position(2, 0),
                Position(0, 1),
                Position(1, 1),
                Position(2, 1),
                Position(3, 1),
                Position(1, 2),
                Position(2, 2),
                Position(3, 2),
                Position(2, 3),
            )
    }

    @ParameterizedTest(name = "size {0} at ({1},{2}) {3} on board: {4}")
    @CsvSource(
        "5, 5, 0, HORIZONTAL, true",
        "5, 6, 0, HORIZONTAL, false",
        "5, 0, 5, VERTICAL, true",
        "5, 0, 6, VERTICAL, false",
        "2, -1, 0, HORIZONTAL, false",
        "2, 0, 10, HORIZONTAL, false",
        "0, 0, 0, HORIZONTAL, false",
        "-1, 0, 0, HORIZONTAL, false",
        "2147483647, 0, 0, HORIZONTAL, false",
    )
    fun shouldTellWhetherShipIsOnTheBoard(
        size: Int,
        x: Int,
        y: Int,
        direction: Direction,
        expected: Boolean,
    ) {
        // given
        val ship = ship(size, x, y, direction)

        // when
        val onBoard = ship.isOnBoard()

        // then
        onBoard shouldBe expected
    }
}
