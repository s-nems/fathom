package io.github.snems.fathom.bot.placing

import io.github.snems.fathom.SampleFleets.COMPLETE
import io.github.snems.fathom.board.Board
import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.github.snems.fathom.board.cells
import io.github.snems.fathom.board.claimedCells
import io.github.snems.fathom.board.isOnBoard
import io.github.snems.fathom.bot.FathomBot
import io.github.snems.fathom.bot.untimedBot
import io.github.snems.fathom.game.Fleet
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.doubles.shouldBeGreaterThan
import io.kotest.matchers.ints.shouldBeLessThan
import io.kotest.matchers.shouldBe
import jd.mg.ships.tournament.api.Direction.HORIZONTAL
import jd.mg.ships.tournament.api.ShipPlacement
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource
import kotlin.math.abs
import kotlin.random.Random

class PlacingFleetTest {
    @Test
    fun shouldPlaceALegalFleetShipByShip() {
        repeat(SEEDS) { seed ->
            // when
            val fleet = fleetOf(untimedBot(Random(seed)))

            // then
            fleet shouldHaveSize FLEET_SHIP_SIZES.size
        }
    }

    @Test
    fun shouldPlaceTheSizeThatComesFirstInTheList() {
        repeat(SEEDS) { seed ->
            // given
            val random = Random(seed)
            val bot = untimedBot(random)
            val sizes = FLEET_SHIP_SIZES.shuffled(random).toMutableList()
            val placed = mutableListOf<ShipPlacement>()

            // when, then
            while (sizes.isNotEmpty()) {
                val ship = bot.placeShip(placed.toList(), sizes.toList())
                ship.size shouldBe sizes.first()
                placed += ship
                sizes.removeAt(0)
            }
            placed.fold(Fleet.EMPTY, Fleet::place).isComplete shouldBe true
        }
    }

    @Test
    fun shouldCompleteAFleetItDidNotStart() {
        // given
        val bot = untimedBot(Random(SEED))
        var fleet = COMPLETE.take(STARTED_BY_SOMEONE_ELSE).fold(Fleet.EMPTY, Fleet::place)

        // when
        while (!fleet.isComplete) {
            fleet = fleet.place(bot.placeShip(fleet.ships, fleet.remainingSizes))
        }

        // then
        fleet.ships.take(STARTED_BY_SOMEONE_ELSE) shouldBe COMPLETE.take(STARTED_BY_SOMEONE_ELSE)
    }

    @Test
    fun shouldFollowItsPlanWhenTheRefereeKeepsOneGrowingList() {
        // given
        val bot = untimedBot(Random(SEED))
        val growing = mutableListOf<ShipPlacement>()
        var fleet = Fleet.EMPTY

        // when
        while (!fleet.isComplete) {
            val ship = bot.placeShip(growing, fleet.remainingSizes)
            fleet = fleet.place(ship)
            growing += ship
        }

        // then
        fleet.ships shouldBe fleetOf(untimedBot(Random(SEED)))
    }

    @Test
    fun shouldAnswerDifferentlyEachTimeAPlacementIsRefused() {
        // given
        val bot = untimedBot(Random(SEED))

        // when
        val answers = List(ATTEMPTS) { bot.placeShip(emptyList(), FLEET_SHIP_SIZES) }

        // then
        answers.distinct() shouldHaveSize ATTEMPTS
        answers.forEach { ship ->
            ship.size shouldBe FLEET_SHIP_SIZES.first()
            ship.isOnBoard() shouldBe true
        }
    }

    @Test
    fun shouldKeepLaterShipsApartEvenAtCornersOnceAPlacementWasRefused() {
        repeat(SEEDS) { seed ->
            // given
            val bot = untimedBot(Random(seed))
            val refusedAt = seed % FLEET_SHIP_SIZES.size
            var fleet = Fleet.EMPTY

            // when
            while (!fleet.isComplete) {
                if (fleet.ships.size == refusedAt) bot.placeShip(fleet.ships, fleet.remainingSizes)
                fleet = fleet.place(bot.placeShip(fleet.ships, fleet.remainingSizes))
            }

            // then
            val placedAfterRefusal = fleet.ships.drop(refusedAt)
            placedAfterRefusal.forEach { ship ->
                (fleet.ships - ship).none { other -> touch(ship, other) } shouldBe true
            }
        }
    }

    @Test
    fun shouldNeverBeRefusedThreeTimesInARowByARefereeThatForbidsCornerContact() {
        repeat(SEEDS) { seed ->
            // given
            val bot = untimedBot(Random(seed))
            val accepted = mutableListOf<ShipPlacement>()
            val sizes = FLEET_SHIP_SIZES.toMutableList()
            var refusedInARow = 0

            // when
            while (sizes.isNotEmpty()) {
                val ship = bot.placeShip(accepted.toList(), sizes.toList())
                if (accepted.any { touch(ship, it) }) {
                    refusedInARow++
                } else {
                    accepted += ship
                    sizes.removeAt(0)
                    refusedInARow = 0
                }

                // then
                refusedInARow shouldBeLessThan REFUSALS_TO_FORFEIT
            }
        }
    }

    @Test
    fun shouldSurviveARefereeThatRefusesAtRandom() {
        repeat(SEEDS) { seed ->
            // given
            val random = Random(seed)
            val bot = untimedBot(random)
            var fleet = Fleet.EMPTY
            var refusedInARow = 0

            // when
            while (!fleet.isComplete) {
                val ship = bot.placeShip(fleet.ships, fleet.remainingSizes)
                val refuse = refusedInARow < REFUSALS_TO_FORFEIT - 1 && random.nextDouble() < REFUSAL_CHANCE
                if (refuse) {
                    refusedInARow++
                } else {
                    // then
                    fleet.accepts(ship) shouldBe true
                    fleet = fleet.place(ship)
                    refusedInARow = 0
                }
            }
        }
    }

    @Test
    fun shouldLayLongShipsAlongEdgesAsOftenAsThePolicySays() {
        // when
        val always = edgeShare(LayoutPolicy(edgeChance = 1.0, drafts = 1))
        val never = edgeShare(LayoutPolicy(edgeChance = 0.0, drafts = 1))

        // then
        always shouldBeGreaterThan MOSTLY
        never shouldBeGreaterThan 0.0
        (always - never) shouldBeGreaterThan CLEAR_DIFFERENCE
    }

    @Test
    fun shouldLeaveShortShipsOutOfTheEdgeRule() {
        // when
        val longOnly = edgeShare(LayoutPolicy(edgeChance = 1.0, drafts = 1), sizes = SHORT)
        val everySize = edgeShare(LayoutPolicy(longShipSize = SHORT, edgeChance = 1.0, drafts = 1), sizes = SHORT)

        // then
        (everySize - longOnly) shouldBeGreaterThan NOTICEABLE_DIFFERENCE
    }

    @Test
    fun shouldKeepTheDraftWithTheMostFreeCells() {
        // when
        val bestOfMany = meanFreeCells(LayoutPolicy(edgeChance = 0.0, drafts = MANY_DRAFTS))
        val firstDraft = meanFreeCells(LayoutPolicy(edgeChance = 0.0, drafts = 1))

        // then
        (bestOfMany - firstDraft) shouldBeGreaterThan CLEAR_FREE_CELLS
    }

    @ParameterizedTest(name = "edge chance {0}, {1} drafts")
    @CsvSource("-0.1, 1", "1.1, 1", "0.5, 0")
    fun shouldRefuseAPolicyOutOfRange(
        edgeChance: Double,
        drafts: Int,
    ) {
        // then
        shouldThrow<IllegalArgumentException> { LayoutPolicy(edgeChance = edgeChance, drafts = drafts) }
    }

    private fun fleetOf(bot: FathomBot): List<ShipPlacement> {
        var fleet = Fleet.EMPTY
        while (!fleet.isComplete) {
            fleet = fleet.place(bot.placeShip(fleet.ships, fleet.remainingSizes))
        }
        return fleet.ships
    }

    private fun fleets(policy: LayoutPolicy) = List(SEEDS) { seed -> fleetOf(untimedBot(Random(seed), policy)) }

    /**
     * Share of the ships of the given size, or of the long ships, that lie along an edge of the board.
     */
    private fun edgeShare(
        policy: LayoutPolicy,
        sizes: Int? = null,
    ): Double {
        val ships = fleets(policy).flatten().filter { if (sizes == null) it.size > SHORT else it.size == sizes }
        return ships.count(::isAlongEdge).toDouble() / ships.size
    }

    private fun meanFreeCells(policy: LayoutPolicy): Double =
        fleets(policy).map { Board.positions.size - it.claimedCells().size }.average()

    private fun isAlongEdge(ship: ShipPlacement): Boolean {
        val line = if (ship.direction == HORIZONTAL) ship.position.y else ship.position.x
        return line == 0 || line == Board.SIZE - 1
    }

    /**
     * Whether two ships touch, at an edge or at a corner.
     */
    private fun touch(
        ship: ShipPlacement,
        other: ShipPlacement,
    ): Boolean = ship.cells().any { a -> other.cells().any { b -> abs(a.x - b.x) <= 1 && abs(a.y - b.y) <= 1 } }

    private companion object {
        const val SEED = 7
        const val SEEDS = 100
        const val ATTEMPTS = 3
        const val STARTED_BY_SOMEONE_ELSE = 3
        const val REFUSAL_CHANCE = 0.3
        const val REFUSALS_TO_FORFEIT = 3
        const val SHORT = 2
        const val MANY_DRAFTS = 20
        const val MOSTLY = 0.9
        const val CLEAR_DIFFERENCE = 0.3
        const val NOTICEABLE_DIFFERENCE = 0.2
        const val CLEAR_FREE_CELLS = 3.0
    }
}
