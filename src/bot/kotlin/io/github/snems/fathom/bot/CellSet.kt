package io.github.snems.fathom.bot

/** A fixed set of board cells as two words of bits: [low] holds cells 0 to 63, [high] the rest. */
internal class Cells(
    cells: IntArray,
) {
    val low: Long = cells.fold(0L) { bits, cell -> bits or lowBit(cell) }
    val high: Long = cells.fold(0L) { bits, cell -> bits or highBit(cell) }
}

/** A set of board cells that grows. As bits, "do these overlap" takes two operations. */
internal class CellSet {
    var low = 0L
        private set
    var high = 0L
        private set

    val size: Int get() = low.countOneBits() + high.countOneBits()

    fun clear() {
        low = 0L
        high = 0L
    }

    fun add(cell: Int) {
        low = low or lowBit(cell)
        high = high or highBit(cell)
    }

    fun add(cells: Cells) {
        low = low or cells.low
        high = high or cells.high
    }

    fun overlaps(cells: Cells): Boolean = (low and cells.low) != 0L || (high and cells.high) != 0L

    operator fun contains(cell: Int): Boolean = (low and lowBit(cell)) != 0L || (high and highBit(cell)) != 0L
}

private fun lowBit(cell: Int): Long = if (cell < Long.SIZE_BITS) 1L shl cell else 0L

private fun highBit(cell: Int): Long = if (cell < Long.SIZE_BITS) 0L else 1L shl (cell - Long.SIZE_BITS)
