package io.github.snems.fathom.engine.heat

import io.github.snems.fathom.engine.board.CELLS
import io.github.snems.fathom.engine.catalogue.ShooterFactories
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.ints.shouldBeLessThanOrEqual
import io.kotest.matchers.shouldBe
import kotlin.test.Test

class ShooterHeatCounterTest {
    private val counter = ShooterHeatCounter(ShooterFactories())

    @Test
    fun shouldCountWhereEachShotOfAShooterGoes() {
        // when
        val counted = counter.count("density", SOURCE, GAMES, SEED)

        // then: every game has a first shot, and no game shoots twice at a cell
        counted.turns shouldHaveSize CELLS
        counted.turns.first().sum() shouldBe GAMES
        (0 until CELLS).forEach { cell -> counted.turns.sumOf { it[cell] } shouldBeLessThanOrEqual GAMES }
    }

    @Test
    fun shouldRefuseWhatItCannotCount() {
        // when, then
        shouldThrow<IllegalArgumentException> { counter.count("psychic", SOURCE, GAMES, SEED) }
        shouldThrow<IllegalArgumentException> { counter.count("density", SOURCE, games = 0, SEED) }
    }

    private companion object {
        const val SOURCE = "sequential"
        const val GAMES = 5
        const val SEED = 2L
    }
}
