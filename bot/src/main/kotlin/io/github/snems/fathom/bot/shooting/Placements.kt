package io.github.snems.fathom.bot.shooting

import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.github.snems.fathom.bot.Candidate
import io.github.snems.fathom.bot.CellSet

/**
 * Some placements of one ship size, with their cells side by side so that a scan over them is fast.
 */
internal class Placements(
    private val candidates: List<Candidate>,
) {
    private val low = LongArray(candidates.size) { candidates[it].covered.low }
    private val high = LongArray(candidates.size) { candidates[it].covered.high }

    operator fun get(index: Int): Candidate = candidates[index]

    /**
     * How many of the placements cover none of the taken cells.
     */
    fun countFreeOf(taken: CellSet): Int {
        var free = 0
        forEachFreeOf(taken) { free++ }
        return free
    }

    /**
     * Writes the indices of the placements that cover none of the taken cells into [indices], from position
     * [start] on, and returns how many it wrote.
     */
    fun freeOf(
        taken: CellSet,
        indices: IntArray,
        start: Int = 0,
    ): Int {
        var next = start
        forEachFreeOf(taken) { indices[next++] = it }
        return next - start
    }

    private inline fun forEachFreeOf(
        taken: CellSet,
        action: (Int) -> Unit,
    ) {
        val takenLow = taken.low
        val takenHigh = taken.high
        for (index in low.indices) {
            if ((low[index] and takenLow) == 0L && (high[index] and takenHigh) == 0L) action(index)
        }
    }

    companion object {
        /**
         * Ship sizes of the fleet, largest first, each once.
         */
        val SIZES: IntArray = FLEET_SHIP_SIZES.distinct().sortedDescending().toIntArray()

        /**
         * Length of an array that is indexed by ship size.
         */
        val LENGTH_BY_SIZE: Int = SIZES.first() + 1

        /**
         * The largest number of placements a ship size has.
         */
        val MOST_OF_A_SIZE: Int = Candidate.BY_SIZE.values.maxOf { it.size }

        /**
         * Every placement on the board, looked up by ship size.
         */
        val ALL: Array<Placements> = bySize { size -> Candidate.BY_SIZE.getValue(size) }

        /**
         * An array to look placements up by ship size. Sizes that are not in the fleet get none.
         */
        fun bySize(candidates: (Int) -> List<Candidate>): Array<Placements> =
            Array(LENGTH_BY_SIZE) { size -> Placements(if (size in SIZES) candidates(size) else emptyList()) }
    }
}
