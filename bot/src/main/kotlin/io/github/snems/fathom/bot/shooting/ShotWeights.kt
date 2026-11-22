package io.github.snems.fathom.bot.shooting

/**
 * Says how promising each cell is as the next shot.
 */
internal fun interface ShotWeights {
    /**
     * Weight of every cell by its index. A weight of 0 says nothing about the cell. Above that, only the order matters.
     */
    fun weights(): DoubleArray
}
