package io.github.snems.fathom.bot

/** A set of board cells as two words of bits, which makes "do these overlap" two operations. */
internal class CellSet {
    /** Cells 0 to 63. */
    var low = 0L
        private set

    /** Cells 64 to 99. */
    var high = 0L
        private set

    fun clear() {
        low = 0L
        high = 0L
    }

    fun addCellsOf(ship: Candidate) {
        low = low or ship.cellsLow
        high = high or ship.cellsHigh
    }

    /** Adds the cells of the ship and the cells that share an edge with it. */
    fun addClaimOf(ship: Candidate) {
        low = low or ship.claimLow
        high = high or ship.claimHigh
    }

    fun add(cell: Int) {
        if (cell < Long.SIZE_BITS) low = low or (1L shl cell) else high = high or (1L shl (cell - Long.SIZE_BITS))
    }

    /** Whether the ship lies on a cell of this set. */
    fun overlaps(ship: Candidate): Boolean = (low and ship.cellsLow) != 0L || (high and ship.cellsHigh) != 0L

    val size: Int get() = low.countOneBits() + high.countOneBits()

    operator fun contains(cell: Int): Boolean =
        if (cell < Long.SIZE_BITS) ((low shr cell) and 1L) == 1L else ((high shr (cell - Long.SIZE_BITS)) and 1L) == 1L
}
