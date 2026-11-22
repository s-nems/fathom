package io.github.snems.fathom.bot

import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.ValueSource

class CellSetTest {
    @ParameterizedTest(name = "cell {0}")
    @ValueSource(ints = [0, 1, 62, 63, 64, 65, 98, 99])
    fun shouldHoldExactlyTheCellAdded(cell: Int) {
        // given
        val cells = CellSet()

        // when
        cells.add(cell)

        // then
        (0..<CELL_COUNT).filter { it in cells } shouldBe listOf(cell)
        cells.size shouldBe 1
    }

    @ParameterizedTest(name = "cell {0}")
    @ValueSource(ints = [0, 63, 64, 99])
    fun shouldOverlapCellsItShares(cell: Int) {
        // given
        val cells = CellSet().apply { add(Cells(intArrayOf(cell))) }

        // when, then
        cells.overlaps(Cells(intArrayOf(cell, NEIGHBOUR_OF_NONE))) shouldBe true
        cells.overlaps(Cells(intArrayOf(NEIGHBOUR_OF_NONE))) shouldBe false
    }

    @Test
    fun shouldBeEmptyAfterClearing() {
        // given
        val cells = CellSet().apply { add(Cells(intArrayOf(3, 70))) }

        // when
        cells.clear()

        // then
        cells.size shouldBe 0
    }

    private companion object {
        /**
         * A cell none of the rows above uses.
         */
        const val NEIGHBOUR_OF_NONE = 40
    }
}
