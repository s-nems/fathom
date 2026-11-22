package io.github.snems.fathom.bot.shooting

import io.github.snems.fathom.SampleFleets.COMPLETE
import io.github.snems.fathom.board.Board
import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.github.snems.fathom.board.cells
import io.github.snems.fathom.board.edgeNeighbours
import io.github.snems.fathom.bot.CELL_COUNT
import io.github.snems.fathom.bot.TimeBudget
import io.github.snems.fathom.bot.index
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.doubles.plusOrMinus
import io.kotest.matchers.shouldBe
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement
import jd.mg.ships.tournament.api.Shot
import jd.mg.ships.tournament.api.ShotResult.HIT
import jd.mg.ships.tournament.api.ShotResult.MISS
import jd.mg.ships.tournament.api.ShotResult.SUNK
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource
import org.junit.jupiter.params.provider.ValueSource
import java.util.BitSet
import kotlin.random.Random
import kotlin.time.AbstractLongTimeSource
import kotlin.time.Duration
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.DurationUnit
import kotlin.time.TimeSource

/**
 * Compares the sampler with a sum over every fleet that agrees with the shots, in positions with few ships
 * afloat, where listing them all is quick. Each position runs with every kind of belief about the opponent.
 */
class FleetSamplerTest {
    private val waters = EnemyWaters()

    @ParameterizedTest(name = "belief in sequential placing {0}")
    @ValueSource(doubles = [0.0, 0.5, 1.0])
    fun shouldMatchEveryFleetWhenNoHitIsOpen(sequentialChance: Double) {
        // given
        sink(COMPLETE.dropLast(2))

        // when
        val sampled = shares(sample(sequentialChance))

        // then
        sampled shouldMatch shares(sumOverEveryFleet(sequentialChance))
    }

    @ParameterizedTest(name = "belief in sequential placing {0}")
    @ValueSource(doubles = [0.0, 0.5, 1.0])
    fun shouldMatchEveryFleetWhenOneShipIsHit(sequentialChance: Double) {
        // given
        val afloat = listOf(COMPLETE[5], COMPLETE[8], COMPLETE[9])
        sink(COMPLETE - afloat.toSet())
        hit(afloat.first().cells()[1])

        // when
        val sampled = shares(sample(sequentialChance))

        // then
        sampled shouldMatch shares(sumOverEveryFleet(sequentialChance))
    }

    @ParameterizedTest(name = "belief in sequential placing {0}")
    @ValueSource(doubles = [0.0, 0.5, 1.0])
    fun shouldMatchEveryFleetWhenShipsOfDifferentSizesAreHit(sequentialChance: Double) {
        // given
        val afloat = listOf(COMPLETE[2], COMPLETE[5], COMPLETE[9])
        sink(COMPLETE - afloat.toSet())
        hit(afloat[0].cells()[0])
        hit(afloat[1].cells()[2])
        miss(Position(9, 9))

        // when
        val sampled = shares(sample(sequentialChance))

        // then
        sampled shouldMatch shares(sumOverEveryFleet(sequentialChance))
    }

    @ParameterizedTest(name = "belief in sequential placing {0}")
    @ValueSource(doubles = [0.0, 0.5, 1.0])
    fun shouldMatchEveryFleetWhenShipsOfEqualSizeAreHitWithAGapBetweenHits(sequentialChance: Double) {
        // given
        val afloat = listOf(COMPLETE[3], COMPLETE[4], COMPLETE[5], COMPLETE[9])
        sink(COMPLETE - afloat.toSet())
        hit(afloat[0].cells()[1])
        hit(afloat[2].cells()[0])
        hit(afloat[2].cells()[2])
        (0..<Board.SIZE).forEach { x -> miss(Position(x, 8)) }
        (0..4).forEach { x -> miss(Position(x, 5)) }

        // when
        val sampled = shares(sample(sequentialChance))

        // then
        sampled shouldMatch shares(sumOverEveryFleet(sequentialChance))
    }

    @ParameterizedTest(name = "belief in sequential placing {0}")
    @ValueSource(doubles = [0.0, 0.5, 1.0])
    fun shouldMatchEveryFleetWhenTwoHitsCouldBeAWholeShip(sequentialChance: Double) {
        // given
        val afloat = listOf(COMPLETE[5], COMPLETE[8], COMPLETE[9])
        sink(COMPLETE - afloat.toSet())
        hit(afloat.first().cells()[0])
        hit(afloat.first().cells()[1])

        // when
        val sampled = shares(sample(sequentialChance))

        // then
        sampled shouldMatch shares(sumOverEveryFleet(sequentialChance))
    }

    @Test
    fun shouldEstimateTheNumberOfLegalFleets() {
        // when
        val weights = sample(sequentialChance = 0.0, samples = MANY_SAMPLES)

        // then
        val meanWeightOfAFleet = weights.sum() / FLEET_SHIP_SIZES.sum() / MANY_SAMPLES
        meanWeightOfAFleet shouldBe (PlacingBelief.LEGAL_FLEETS plusOrMinus PlacingBelief.LEGAL_FLEETS * ESTIMATE_ERROR)
    }

    @Test
    fun shouldSayNothingWhenNoFleetAgreesWithTheShots() {
        // given
        sink(COMPLETE.dropLast(1))
        Board.positions.forEach(::miss)

        // when
        val weights = sample(sequentialChance = 1.0)

        // then
        weights.all { it == 0.0 } shouldBe true
    }

    @Test
    fun shouldStopDrawingWhenItsTimeIsUp() {
        // given
        val unlimitedSamples = SamplerSettings(samples = Int.MAX_VALUE)
        val budget = TimeBudget(TICKS_IN_BUDGET.milliseconds, TickingTimeSource())

        // when
        val stoppedByTime = FleetSampler(waters, Random(SEED), unlimitedSamples, budget).weights()

        // then
        val belief = SamplerSettings().sequentialChance
        val drawn = (1..TICKS_IN_BUDGET).filter { samples -> sample(belief, samples).contentEquals(stoppedByTime) }
        drawn shouldBe listOf(FLEETS_DRAWN_IN_BUDGET)
    }

    @ParameterizedTest(name = "{0} samples, sequential chance {1}")
    @CsvSource("-1, 0.5", "1, -0.1", "1, 1.1")
    fun shouldRefuseSettingsOutOfRange(
        samples: Int,
        sequentialChance: Double,
    ) {
        // then
        shouldThrow<IllegalArgumentException> { SamplerSettings(samples, sequentialChance) }
    }

    /**
     * A clock that moves on by a millisecond each time it is read.
     */
    private class TickingTimeSource : AbstractLongTimeSource(DurationUnit.MILLISECONDS) {
        private var now = 0L

        override fun read(): Long = now++
    }

    private fun sample(
        sequentialChance: Double,
        samples: Int = SAMPLES,
    ): DoubleArray {
        val unlimited = TimeBudget(Duration.INFINITE, TimeSource.Monotonic)
        return FleetSampler(waters, Random(SEED), SamplerSettings(samples, sequentialChance), unlimited).weights()
    }

    // What the test knows about the position, kept apart from what it tells the sampler, so that the exact sum
    // below shares nothing with the code under test but the rules of the board.
    private val misses = BitSet(CELL_COUNT)
    private val hits = BitSet(CELL_COUNT)
    private val sunk = mutableListOf<ShipPlacement>()

    private fun hit(position: Position) {
        hits.set(position.index())
        waters.record(Shot(position, HIT))
    }

    private fun miss(position: Position) {
        misses.set(position.index())
        waters.record(Shot(position, MISS))
    }

    /**
     * Sinks the ships cell by cell, as a referee would report it.
     */
    private fun sink(ships: List<ShipPlacement>) {
        ships.forEach { ship ->
            ship.cells().dropLast(1).forEach { waters.record(Shot(it, HIT)) }
            waters.record(Shot(ship.cells().last(), SUNK, ship))
        }
        sunk += ships
    }

    /**
     * For every cell that is not hit, the summed likelihood of the fleets that agree with the shots and have a
     * ship on it.
     */
    private fun sumOverEveryFleet(sequentialChance: Double): DoubleArray {
        val sums = DoubleArray(CELL_COUNT)

        fun count(fleet: List<ShipPlacement>) {
            val covered = BitSet(CELL_COUNT).also { all -> fleet.forEach { all.or(cellsOf(it)) } }
            val everyHitIsCovered = hits.without(covered).isEmpty
            val everyShipIsAfloat = fleet.none { cellsOf(it).without(hits).isEmpty }
            if (!everyHitIsCovered || !everyShipIsAfloat) return
            val likelihood = likelihood(sunk + fleet, sequentialChance)
            covered.without(hits).stream().forEach { sums[it] += likelihood }
        }

        fun extend(
            fleet: List<ShipPlacement>,
            sizes: List<Int>,
        ) {
            if (sizes.isEmpty()) return count(fleet)
            val size = sizes.first()
            val placements = Board.placementsOf(size)
            val taken = claimOf(sunk + fleet).also { it.or(misses) }
            // Ships of equal size are taken in one order only, so that each fleet is listed once.
            val start = fleet.lastOrNull()?.takeIf { it.size == size }?.let { placements.indexOf(it) + 1 } ?: 0
            val fitting = placements.drop(start).filter { !cellsOf(it).intersects(taken) }
            fitting.forEach { extend(fleet + it, sizes.drop(1)) }
        }
        extend(emptyList(), sunk.fold(FLEET_SHIP_SIZES) { sizes, ship -> sizes - ship.size })
        return sums
    }

    /**
     * Likelihood of a whole fleet under the belief, compared with picking any legal fleet with equal chance.
     */
    private fun likelihood(
        fleet: List<ShipPlacement>,
        sequentialChance: Double,
    ): Double {
        if (sequentialChance == 0.0) return 1.0
        val inSequence = PlacingBelief.LEGAL_FLEETS * chanceOfPlacingInSequence(fleet)
        return sequentialChance * inSequence + (1.0 - sequentialChance)
    }

    /**
     * The chance that placing ship after ship at random, largest first, gives this fleet, over every order.
     */
    private fun chanceOfPlacingInSequence(fleet: List<ShipPlacement>): Double {
        val placed = mutableListOf<ShipPlacement>()
        var chance = 1.0
        for (size in FLEET_SHIP_SIZES.distinct()) {
            val ships = fleet.filter { it.size == size }
            chance *= chanceOfEveryOrder(ships, placed)
            placed += ships
        }
        return chance
    }

    private fun chanceOfEveryOrder(
        toPlace: List<ShipPlacement>,
        placed: List<ShipPlacement>,
    ): Double {
        if (toPlace.isEmpty()) return 1.0
        val taken = claimOf(placed)
        val free = Board.placementsOf(toPlace.first().size).count { !cellsOf(it).intersects(taken) }
        return toPlace.sumOf { next -> chanceOfEveryOrder(toPlace - next, placed + next) } / free
    }

    private val cellBits = HashMap<ShipPlacement, BitSet>()

    private fun cellsOf(ship: ShipPlacement): BitSet = cellBits.getOrPut(ship) { bits(ship.cells()) }

    /**
     * The cells of the ships and the cells sharing an edge with them, where no other ship may lie.
     */
    private fun claimOf(ships: List<ShipPlacement>): BitSet = bits(ships.flatMap { it.cells() + it.edgeNeighbours() })

    private fun bits(positions: Collection<Position>): BitSet =
        BitSet(CELL_COUNT).also { set -> positions.forEach { set.set(it.index()) } }

    private fun BitSet.without(other: BitSet): BitSet = (clone() as BitSet).also { it.andNot(other) }

    private fun shares(weights: DoubleArray): List<Double> = weights.map { it / weights.sum() }

    private infix fun List<Double>.shouldMatch(exact: List<Double>) {
        forEachIndexed { cell, share ->
            if (exact[cell] == 0.0) share shouldBe 0.0 else share shouldBe (exact[cell] plusOrMinus SAMPLING_ERROR)
        }
    }

    private companion object {
        const val SEED = 11
        const val SAMPLES = 100_000
        const val MANY_SAMPLES = 400_000

        /**
         * About twice the largest error seen with this many samples. A wrong weight is off by 0.004 or more.
         */
        const val SAMPLING_ERROR = 0.0015
        const val ESTIMATE_ERROR = 0.02
        const val TICKS_IN_BUDGET = 20

        /**
         * The clock is read once to start the time, once to find its zero, and once before each fleet.
         */
        const val FLEETS_DRAWN_IN_BUDGET = 18
    }
}
