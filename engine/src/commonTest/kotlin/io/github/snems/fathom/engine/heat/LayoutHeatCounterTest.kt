package io.github.snems.fathom.engine.heat

import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.github.snems.fathom.engine.board.CELLS
import io.github.snems.fathom.engine.board.Ship
import io.github.snems.fathom.game.Fleet
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.ints.shouldBeLessThanOrEqual
import io.kotest.matchers.shouldBe
import kotlin.test.Test

class LayoutHeatCounterTest {
    @Test
    fun shouldCountForEachCellTheLayoutsThatCoverIt() {
        // when
        val counted = LayoutHeatCounter.count(SOURCE, LAYOUTS, SEED)

        // then: every layout covers as many cells as the fleet has
        counted.cells shouldHaveSize CELLS
        counted.cells.forEach { it shouldBeLessThanOrEqual LAYOUTS }
        counted.cells.sum() shouldBe LAYOUTS * FLEET_SHIP_SIZES.sum()
    }

    @Test
    fun shouldCountTheShipsOfEachSizeOnTheirOwn() {
        // when
        val counted = LayoutHeatCounter.count(SOURCE, LAYOUTS, SEED)

        // then
        counted.bySize.keys shouldBe FLEET_SHIP_SIZES.toSet()
        counted.bySize.forEach { (size, cells) ->
            cells.sum() shouldBe LAYOUTS * FLEET_SHIP_SIZES.filter { it == size }.sum()
        }
    }

    @Test
    fun shouldShowWholeLegalFleetsAsSamples() {
        // when
        val samples = LayoutHeatCounter.count(SOURCE, LAYOUTS, SEED).samples

        // then
        samples shouldHaveSize LAYOUTS
        samples.forEach { ships -> ships.map(Ship::placement).fold(Fleet.EMPTY, Fleet::place).isComplete shouldBe true }
    }

    @Test
    fun shouldRefuseWhatItCannotCount() {
        // when, then
        shouldThrow<IllegalArgumentException> { LayoutHeatCounter.count("nowhere", LAYOUTS, SEED) }
        shouldThrow<IllegalArgumentException> { LayoutHeatCounter.count(SOURCE, count = 0, SEED) }
    }

    private companion object {
        const val SOURCE = "sequential"
        const val LAYOUTS = 8
        const val SEED = 2L
    }
}
