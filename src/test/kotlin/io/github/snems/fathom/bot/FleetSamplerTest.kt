package io.github.snems.fathom.bot

import io.github.snems.fathom.SampleFleets.COMPLETE
import io.github.snems.fathom.board.Board
import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.github.snems.fathom.board.cells
import io.kotest.matchers.collections.shouldHaveSize
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
import org.junit.jupiter.params.provider.ValueSource
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
    fun shouldMatchEveryFleetWhenNoHitIsOpen(sequentialPlacing: Double) {
        // given
        sink(COMPLETE.dropLast(2))

        // when
        val sampled = shares(sample(sequentialPlacing))

        // then
        sampled shouldMatch shares(sumOverEveryFleet(sequentialPlacing))
    }

    @ParameterizedTest(name = "belief in sequential placing {0}")
    @ValueSource(doubles = [0.0, 0.5, 1.0])
    fun shouldMatchEveryFleetWhenOneShipIsHit(sequentialPlacing: Double) {
        // given
        val afloat = listOf(COMPLETE[5], COMPLETE[8], COMPLETE[9])
        sink(COMPLETE - afloat.toSet())
        waters.record(Shot(afloat.first().cells()[1], HIT))

        // when
        val sampled = shares(sample(sequentialPlacing))

        // then
        sampled shouldMatch shares(sumOverEveryFleet(sequentialPlacing))
    }

    @ParameterizedTest(name = "belief in sequential placing {0}")
    @ValueSource(doubles = [0.0, 0.5, 1.0])
    fun shouldMatchEveryFleetWhenShipsOfDifferentSizesAreHit(sequentialPlacing: Double) {
        // given
        val afloat = listOf(COMPLETE[2], COMPLETE[5], COMPLETE[9])
        sink(COMPLETE - afloat.toSet())
        waters.record(Shot(afloat[0].cells()[0], HIT))
        waters.record(Shot(afloat[1].cells()[2], HIT))
        waters.record(Shot(Position(9, 9), MISS))

        // when
        val sampled = shares(sample(sequentialPlacing))

        // then
        sampled shouldMatch shares(sumOverEveryFleet(sequentialPlacing))
    }

    @ParameterizedTest(name = "belief in sequential placing {0}")
    @ValueSource(doubles = [0.0, 0.5, 1.0])
    fun shouldMatchEveryFleetWhenShipsOfEqualSizeAreHitWithAGapBetweenHits(sequentialPlacing: Double) {
        // given
        val afloat = listOf(COMPLETE[3], COMPLETE[4], COMPLETE[5], COMPLETE[9])
        sink(COMPLETE - afloat.toSet())
        waters.record(Shot(afloat[0].cells()[1], HIT))
        waters.record(Shot(afloat[2].cells()[0], HIT))
        waters.record(Shot(afloat[2].cells()[2], HIT))
        (0 until Board.SIZE).forEach { x -> waters.record(Shot(Position(x, 8), MISS)) }
        (0..4).forEach { x -> waters.record(Shot(Position(x, 5), MISS)) }

        // when
        val sampled = shares(sample(sequentialPlacing))

        // then
        sampled shouldMatch shares(sumOverEveryFleet(sequentialPlacing))
    }

    @ParameterizedTest(name = "belief in sequential placing {0}")
    @ValueSource(doubles = [0.0, 0.5, 1.0])
    fun shouldMatchEveryFleetWhenTwoHitsCouldBeAWholeShip(sequentialPlacing: Double) {
        // given
        val afloat = listOf(COMPLETE[5], COMPLETE[8], COMPLETE[9])
        sink(COMPLETE - afloat.toSet())
        waters.record(Shot(afloat.first().cells()[0], HIT))
        waters.record(Shot(afloat.first().cells()[1], HIT))

        // when
        val sampled = shares(sample(sequentialPlacing))

        // then
        sampled shouldMatch shares(sumOverEveryFleet(sequentialPlacing))
    }

    @Test
    fun shouldEstimateTheNumberOfLegalFleets() {
        // when
        val weights = sample(sequentialPlacing = 0.0, samples = MANY_SAMPLES)

        // then
        val meanWeightOfAFleet = weights.sum() / FLEET_SHIP_SIZES.sum() / MANY_SAMPLES
        meanWeightOfAFleet shouldBe (PlacingBelief.LEGAL_FLEETS plusOrMinus PlacingBelief.LEGAL_FLEETS * ESTIMATE_ERROR)
    }

    @Test
    fun shouldSayNothingWhenNoFleetAgreesWithTheShots() {
        // given
        sink(COMPLETE.dropLast(1))
        Board.positions.forEach { waters.record(Shot(it, MISS)) }

        // when
        val weights = sample(sequentialPlacing = 1.0)

        // then
        weights.all { it == 0.0 } shouldBe true
    }

    @Test
    fun shouldStopDrawingWhenItsTimeIsUp() {
        // given
        val unlimitedSamples = SamplerSettings(samples = Int.MAX_VALUE, timeBudget = TICKS_IN_BUDGET.milliseconds)

        // when
        val stoppedByTime = FleetSampler(waters, Random(SEED), unlimitedSamples, TickingTimeSource()).weights()

        // then
        val fleetsDrawn =
            (1..TICKS_IN_BUDGET).filter { samples ->
                sample(SamplerSettings().sequentialPlacing, samples).contentEquals(stoppedByTime)
            }
        fleetsDrawn shouldHaveSize 1
    }

    /** A clock that moves on by a millisecond each time it is read. */
    private class TickingTimeSource : AbstractLongTimeSource(DurationUnit.MILLISECONDS) {
        private var now = 0L

        override fun read(): Long = now++
    }

    private fun sample(
        sequentialPlacing: Double,
        samples: Int = SAMPLES,
    ): DoubleArray {
        val settings = SamplerSettings(samples, Duration.INFINITE, sequentialPlacing)
        return FleetSampler(waters, Random(SEED), settings, TimeSource.Monotonic).weights()
    }

    /** Tells the bot it has sunk these ships, cell by cell, as a referee would. */
    private fun sink(ships: List<ShipPlacement>) {
        ships.forEach { ship ->
            ship.cells().dropLast(1).forEach { waters.record(Shot(it, HIT)) }
            waters.record(Shot(ship.cells().last(), SUNK, ship))
        }
    }

    /**
     * For every cell that is not hit, the summed likelihood of the fleets that agree with the shots and have a
     * ship on it.
     */
    private fun sumOverEveryFleet(sequentialPlacing: Double): DoubleArray {
        val sums = DoubleArray(CELL_COUNT)
        val hits = waters.openHits().toSet()

        fun extend(
            fleet: List<Candidate>,
            sizes: List<Int>,
        ) {
            if (sizes.isEmpty()) {
                val covered = fleet.flatMap { it.cells.asList() }.toSet()
                val everyShipAfloat = fleet.none { ship -> ship.cells.all { it in hits } }
                if (covered.containsAll(hits) && everyShipAfloat) {
                    val likelihood = likelihood(waters.sunk + fleet, sequentialPlacing)
                    (covered - hits).forEach { sums[it] += likelihood }
                }
                return
            }
            val size = sizes.first()
            val candidates = Candidate.BY_SIZE.getValue(size)
            // Ships of equal size are taken in one order only, so that each fleet is listed once.
            val start = fleet.lastOrNull()?.takeIf { it.cells.size == size }?.let { candidates.indexOf(it) + 1 } ?: 0
            for (candidate in candidates.drop(start)) {
                if (waters.allows(candidate) &&
                    fleet.all(candidate::keepsClearOf)
                ) {
                    extend(fleet + candidate, sizes.drop(1))
                }
            }
        }
        extend(emptyList(), waters.afloat)
        return sums
    }

    /** Likelihood of a whole fleet under the belief, compared with picking any legal fleet with equal chance. */
    private fun likelihood(
        fleet: List<Candidate>,
        sequentialPlacing: Double,
    ): Double = sequentialPlacing * PlacingBelief.LEGAL_FLEETS * sequentialChance(fleet) + (1.0 - sequentialPlacing)

    /** The chance that placing ship after ship at random, largest first, gives this fleet, over every order. */
    private fun sequentialChance(fleet: List<Candidate>): Double {
        val placed = mutableListOf<Candidate>()
        var chance = 1.0
        for (size in FLEET_SHIP_SIZES.distinct()) {
            val ships = fleet.filter { it.cells.size == size }
            chance *= chanceOfEveryOrder(ships, placed)
            placed += ships
        }
        return chance
    }

    private fun chanceOfEveryOrder(
        toPlace: List<Candidate>,
        placed: List<Candidate>,
    ): Double {
        if (toPlace.isEmpty()) return 1.0
        val free = Candidate.BY_SIZE.getValue(toPlace.first().cells.size).count { placed.all(it::keepsClearOf) }
        return toPlace.sumOf { next -> chanceOfEveryOrder(toPlace - next, placed + next) } / free
    }

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

        /** About twice the largest error seen with this many samples. A wrong weight is off by 0.004 or more. */
        const val SAMPLING_ERROR = 0.0015
        const val ESTIMATE_ERROR = 0.02
        const val TICKS_IN_BUDGET = 20
    }
}
