package io.github.snems.fathom.game

import io.github.snems.fathom.SampleFleets.COMPLETE
import io.github.snems.fathom.SampleFleets.TRANSPOSED
import io.github.snems.fathom.SampleFleets.ship
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.collections.shouldBeEmpty
import io.kotest.matchers.collections.shouldContainExactly
import io.kotest.matchers.shouldBe
import jd.mg.ships.tournament.api.Direction
import jd.mg.ships.tournament.api.Direction.HORIZONTAL
import jd.mg.ships.tournament.api.Direction.VERTICAL
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource
import org.junit.jupiter.params.provider.ValueSource

class FleetTest {
    private val carrier = ship(5, 2, 4, HORIZONTAL)

    @Test
    fun shouldStartWithEveryShipToPlace() {
        // when
        val fleet = Fleet.EMPTY

        // then
        fleet.ships.shouldBeEmpty()
        fleet.remainingSizes shouldContainExactly listOf(5, 4, 4, 3, 3, 3, 2, 2, 2, 2)
        fleet.isComplete shouldBe false
    }

    @Test
    fun shouldBeCompleteOnceEveryShipIsPlaced() {
        // when
        val fleet = COMPLETE.fold(Fleet.EMPTY, Fleet::place)

        // then
        fleet.ships shouldContainExactly COMPLETE
        fleet.remainingSizes.shouldBeEmpty()
        fleet.isComplete shouldBe true
    }

    @Test
    fun shouldAcceptTheOtherSampleFleet() {
        // when
        val fleet = TRANSPOSED.fold(Fleet.EMPTY, Fleet::place)

        // then
        fleet.isComplete shouldBe true
    }

    @Test
    fun shouldTakePlacedSizeOffTheRemainingOnes() {
        // when
        val fleet = Fleet.EMPTY.place(ship(4, 0, 0, HORIZONTAL)).place(ship(2, 0, 2, HORIZONTAL))

        // then
        fleet.remainingSizes shouldContainExactly listOf(5, 4, 3, 3, 3, 2, 2, 2)
    }

    @Test
    fun shouldLeaveEarlierFleetUnchanged() {
        // given
        val before = Fleet.EMPTY

        // when
        before.place(carrier)

        // then
        before.ships.shouldBeEmpty()
    }

    @ParameterizedTest(name = "size {0} at ({1},{2}) {3}")
    @CsvSource(
        "5, 6, 0, HORIZONTAL",
        "5, 0, 6, VERTICAL",
        "2, 9, 9, HORIZONTAL",
        "2, -1, 0, HORIZONTAL",
        "2, 0, -1, VERTICAL",
        "2, 10, 0, VERTICAL",
    )
    fun shouldRejectShipLeavingTheBoard(
        size: Int,
        x: Int,
        y: Int,
        direction: Direction,
    ) {
        // given
        val ship = ship(size, x, y, direction)

        // when
        val accepted = Fleet.EMPTY.accepts(ship)

        // then
        accepted shouldBe false
    }

    @ParameterizedTest(name = "size {0} at ({1},{2}) {3}")
    @CsvSource(
        "4, 4, 2, VERTICAL",
        "2, 6, 4, HORIZONTAL",
        "3, 2, 4, HORIZONTAL",
    )
    fun shouldRejectShipOverlappingAnother(
        size: Int,
        x: Int,
        y: Int,
        direction: Direction,
    ) {
        // given
        val fleet = Fleet.EMPTY.place(carrier)

        // when
        val accepted = fleet.accepts(ship(size, x, y, direction))

        // then
        accepted shouldBe false
    }

    @ParameterizedTest(name = "size {0} at ({1},{2}) {3}")
    @CsvSource(
        "4, 2, 3, HORIZONTAL",
        "4, 3, 5, HORIZONTAL",
        "2, 0, 4, HORIZONTAL",
        "2, 7, 4, HORIZONTAL",
        "3, 4, 1, VERTICAL",
        "3, 7, 2, VERTICAL",
    )
    fun shouldRejectShipSharingAnEdgeWithAnother(
        size: Int,
        x: Int,
        y: Int,
        direction: Direction,
    ) {
        // given
        val fleet = Fleet.EMPTY.place(carrier)

        // when
        val accepted = fleet.accepts(ship(size, x, y, direction))

        // then
        accepted shouldBe false
    }

    @ParameterizedTest(name = "size {0} at ({1},{2}) {3}")
    @CsvSource(
        "2, 0, 3, HORIZONTAL",
        "2, 7, 5, HORIZONTAL",
        "3, 1, 5, VERTICAL",
        "3, 7, 1, VERTICAL",
    )
    fun shouldAcceptShipTouchingAnotherAtCorner(
        size: Int,
        x: Int,
        y: Int,
        direction: Direction,
    ) {
        // given
        val fleet = Fleet.EMPTY.place(carrier)

        // when
        val accepted = fleet.accepts(ship(size, x, y, direction))

        // then
        accepted shouldBe true
    }

    @ParameterizedTest
    @ValueSource(ints = [-1, 0, 1, 6, Int.MAX_VALUE])
    fun shouldRejectSizeThatIsNotInTheFleet(size: Int) {
        // given
        val ship = ship(size, 0, 0, HORIZONTAL)

        // when
        val accepted = Fleet.EMPTY.accepts(ship)

        // then
        accepted shouldBe false
    }

    @Test
    fun shouldRejectSizeThatIsUsedUp() {
        // given
        val fleet = Fleet.EMPTY.place(carrier)

        // when
        val accepted = fleet.accepts(ship(5, 0, 0, VERTICAL))

        // then
        accepted shouldBe false
    }

    @Test
    fun shouldThrowWhenPlacingShipItDoesNotAccept() {
        // given
        val fleet = Fleet.EMPTY.place(carrier)

        // when, then
        shouldThrow<IllegalArgumentException> { fleet.place(ship(4, 2, 3, HORIZONTAL)) }
    }
}
