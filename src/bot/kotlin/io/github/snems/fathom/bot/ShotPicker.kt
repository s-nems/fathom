package io.github.snems.fathom.bot

import io.github.snems.fathom.board.Board
import jd.mg.ships.tournament.api.Position
import kotlin.random.Random

/** Says how promising each cell is as the next shot. */
internal fun interface ShotWeights {
    /** Weight of every cell by its index. Only the order of the weights matters. */
    fun weights(): DoubleArray
}

/**
 * Picks the next shot: the heaviest offered cell by the first source of weights that has anything to say about
 * the offered cells. Later sources are simpler and stand in when an earlier one comes back empty.
 */
internal class ShotPicker(
    private val random: Random,
    private val sources: List<ShotWeights>,
) {
    /**
     * The heaviest of the offered cells, at random among equals. Cells off the board are not considered.
     *
     * @throws NoSuchElementException if no offered cell is on the board
     */
    fun pick(offered: List<Position>): Position {
        val onBoard = offered.filter { it in Board }
        if (onBoard.isEmpty()) throw NoSuchElementException("No cell on the board among $offered")
        for (source in sources) {
            val weights = source.weights()
            val heaviest = onBoard.maxOf { weights[it.index()] }
            if (heaviest > 0.0) return onBoard.filter { weights[it.index()] == heaviest }.random(random)
        }
        return onBoard.random(random)
    }
}
