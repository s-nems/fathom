package io.github.snems.fathom.bot

import io.github.snems.fathom.game.Fleet
import io.github.snems.fathom.game.FleetUnderFire
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.ints.shouldBeLessThan
import io.kotest.matchers.shouldBe
import jd.mg.ships.tournament.api.Position
import org.junit.jupiter.api.Test
import kotlin.random.Random
import kotlin.time.Duration
import kotlin.time.TimeSource

class ShotPickerTest {
    private val heavyAtOrigin = ShotWeights { DoubleArray(CELL_COUNT).also { it[ORIGIN.index()] = 1.0 } }
    private val heavyNextToOrigin = ShotWeights { DoubleArray(CELL_COUNT).also { it[NEXT_TO_ORIGIN.index()] = 1.0 } }
    private val silent = ShotWeights { DoubleArray(CELL_COUNT) }

    @Test
    fun shouldPickTheHeaviestCellOfTheFirstSource() {
        // given
        val picker = ShotPicker(Random(SEED), listOf(heavyAtOrigin, heavyNextToOrigin))

        // when
        val shot = picker.pick(listOf(ORIGIN, NEXT_TO_ORIGIN, FAR))

        // then
        shot shouldBe ORIGIN
    }

    @Test
    fun shouldAskTheNextSourceWhenTheFirstHasNothingOnTheOfferedCells() {
        // given
        val picker = ShotPicker(Random(SEED), listOf(heavyAtOrigin, heavyNextToOrigin))

        // when
        val shot = picker.pick(listOf(NEXT_TO_ORIGIN, FAR))

        // then
        shot shouldBe NEXT_TO_ORIGIN
    }

    @Test
    fun shouldPickAnyOfferedCellWhenNoSourceHasAnything() {
        // given
        val picker = ShotPicker(Random(SEED), listOf(silent))

        // when
        val shot = picker.pick(listOf(FAR))

        // then
        shot shouldBe FAR
    }

    @Test
    fun shouldThrowWhenNoOfferedCellIsOnTheBoard() {
        // given
        val picker = ShotPicker(Random(SEED), listOf(heavyAtOrigin))

        // when, then
        shouldThrow<NoSuchElementException> { picker.pick(listOf(Position(-1, 0))) }
    }

    @Test
    fun shouldSinkWholeFleetsWithoutAnErrorAndFasterThanShootingAtRandom() {
        repeat(FLEETS) { seed ->
            // given
            val random = Random(seed)
            val waters = EnemyWaters()
            val settings = SamplerSettings(samples = QUICK_SAMPLES, timeBudget = Duration.INFINITE)
            val sampler = FleetSampler(waters, random, settings, TimeSource.Monotonic)
            val picker = ShotPicker(random, listOf(sampler, PlacementDensity(waters)))
            val target = FleetUnderFire(fleetPlacedBy(FathomBot(random)))
            var shots = 0

            // when
            while (!target.isSunk) {
                waters.record(target.receive(picker.pick(target.unshot())))
                shots++
            }

            // then
            shots shouldBeLessThan SHOTS_OF_A_POOR_SHOOTER
        }
    }

    private fun fleetPlacedBy(bot: FathomBot): Fleet {
        var fleet = Fleet.EMPTY
        while (!fleet.isComplete) {
            fleet = fleet.place(bot.placeShip(fleet.ships, fleet.remainingSizes))
        }
        return fleet
    }

    private companion object {
        const val SEED = 7
        const val FLEETS = 50
        const val QUICK_SAMPLES = 50
        const val SHOTS_OF_A_POOR_SHOOTER = 80
        val ORIGIN = Position(0, 0)
        val NEXT_TO_ORIGIN = Position(1, 0)
        val FAR = Position(9, 9)
    }
}
