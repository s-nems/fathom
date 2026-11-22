package io.github.snems.fathom.bot.shooting

import io.github.snems.fathom.bot.CELL_COUNT
import io.github.snems.fathom.bot.FathomBot
import io.github.snems.fathom.bot.TimeBudget
import io.github.snems.fathom.bot.index
import io.github.snems.fathom.bot.untimedBot
import io.github.snems.fathom.game.Fleet
import io.github.snems.fathom.game.FleetUnderFire
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
        val shot = picker.pick(listOf(ORIGIN, NEXT_TO_ORIGIN, FAR))?.shot

        // then
        shot shouldBe ORIGIN
    }

    @Test
    fun shouldAskTheNextSourceWhenTheFirstHasNothingOnTheOfferedCells() {
        // given
        val picker = ShotPicker(Random(SEED), listOf(heavyAtOrigin, heavyNextToOrigin))

        // when
        val shot = picker.pick(listOf(NEXT_TO_ORIGIN, FAR))?.shot

        // then
        shot shouldBe NEXT_TO_ORIGIN
    }

    @Test
    fun shouldPickAnyOfferedCellWhenNoSourceHasAnything() {
        // given
        val picker = ShotPicker(Random(SEED), listOf(silent))

        // when
        val shot = picker.pick(listOf(FAR))?.shot

        // then
        shot shouldBe FAR
    }

    @Test
    fun shouldTellTheSourceAndTheWeightsItPickedFrom() {
        // given
        val picker = ShotPicker(Random(SEED), listOf(silent, heavyNextToOrigin))

        // when
        val pick = checkNotNull(picker.pick(listOf(ORIGIN, NEXT_TO_ORIGIN)))

        // then
        pick.source shouldBe heavyNextToOrigin
        checkNotNull(pick.weights).indexOfFirst { it > 0.0 } shouldBe NEXT_TO_ORIGIN.index()
    }

    @Test
    fun shouldBreakTiesAtRandom() {
        // when
        val shots = List(PICKERS) { seed -> ShotPicker(Random(seed), listOf(silent)).pick(listOf(ORIGIN, FAR))?.shot }

        // then
        shots.toSet() shouldBe setOf(ORIGIN, FAR)
    }

    @Test
    fun shouldPickNothingWhenNoOfferedCellIsOnTheBoard() {
        // given
        val picker = ShotPicker(Random(SEED), listOf(heavyAtOrigin))

        // when
        val pick = picker.pick(listOf(Position(-1, 0)))

        // then
        pick shouldBe null
    }

    @Test
    fun shouldSinkWholeFleetsWithoutAnErrorAndFasterThanShootingAtRandom() {
        repeat(FLEETS) { seed ->
            // given
            val random = Random(seed)
            val waters = EnemyWaters()
            val unlimited = TimeBudget(Duration.INFINITE, TimeSource.Monotonic)
            val sampler = FleetSampler(waters, random, SamplerSettings(samples = QUICK_SAMPLES), unlimited)
            val picker = ShotPicker(random, listOf(sampler, PlacementDensity(waters)))
            val target = FleetUnderFire(fleetPlacedBy(untimedBot(random)))
            var shots = 0

            // when
            while (!target.isSunk) {
                waters.record(target.receive(checkNotNull(picker.pick(target.unshot())).shot))
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
        const val PICKERS = 20
        const val QUICK_SAMPLES = 50
        const val SHOTS_OF_A_POOR_SHOOTER = 80
        val ORIGIN = Position(0, 0)
        val NEXT_TO_ORIGIN = Position(1, 0)
        val FAR = Position(9, 9)
    }
}
