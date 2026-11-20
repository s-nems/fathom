package io.github.snems.fathom.bot

/** Some placements of one ship size, with their cells side by side so that a scan over them is fast. */
internal class Placements(
    private val candidates: List<Candidate>,
) {
    private val low = LongArray(candidates.size) { candidates[it].cellsLow }
    private val high = LongArray(candidates.size) { candidates[it].cellsHigh }

    operator fun get(index: Int): Candidate = candidates[index]

    /** How many of the placements cover none of the taken cells. */
    fun countFreeOf(taken: CellSet): Int {
        val takenLow = taken.low
        val takenHigh = taken.high
        var free = 0
        for (index in low.indices) {
            if ((low[index] and takenLow) == 0L && (high[index] and takenHigh) == 0L) free++
        }
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
        val takenLow = taken.low
        val takenHigh = taken.high
        var next = start
        for (index in low.indices) {
            if ((low[index] and takenLow) == 0L && (high[index] and takenHigh) == 0L) indices[next++] = index
        }
        return next - start
    }

    companion object {
        /** Ship sizes of the fleet, largest first, each once. */
        val SIZES: IntArray =
            Candidate.BY_SIZE.keys
                .sortedDescending()
                .toIntArray()

        /** The largest number of placements any ship size has. */
        val MOST: Int = Candidate.BY_SIZE.values.maxOf { it.size }

        /** Every placement on the board, looked up by ship size. */
        val ALL: Array<Placements> = bySize { size -> Candidate.BY_SIZE.getValue(size) }

        /** An array to look placements up by ship size. Sizes that are not in the fleet get none. */
        fun bySize(candidates: (Int) -> List<Candidate>): Array<Placements> =
            Array(SIZES.first() + 1) { size -> Placements(if (size in SIZES) candidates(size) else emptyList()) }
    }
}
