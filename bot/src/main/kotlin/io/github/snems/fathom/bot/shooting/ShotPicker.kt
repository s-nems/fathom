package io.github.snems.fathom.bot.shooting

import io.github.snems.fathom.board.Board
import io.github.snems.fathom.bot.index
import jd.mg.ships.tournament.api.Position
import kotlin.random.Random

/**
 * Picks the next shot: the heaviest offered cell by the first source of weights that has anything to say about
 * the offered cells. Later sources are simpler and stand in when an earlier one comes back empty.
 */
internal class ShotPicker(
    private val random: Random,
    private val sources: List<ShotWeights>,
) {
    /**
     * A shot with the source that weighed the cells and its weights. A shot at random has neither.
     */
    class Pick(
        val shot: Position,
        val source: ShotWeights?,
        val weights: DoubleArray?,
    )

    /**
     * The heaviest of the offered cells, at random among equals. Cells off the board are not considered. Null
     * when no offered cell is on the board.
     */
    fun pick(offered: List<Position>): Pick? {
        val onBoard = offered.filter { it in Board }
        if (onBoard.isEmpty()) return null
        for (source in sources) {
            val weights = source.weights()
            val heaviest = onBoard.maxOf { weights[it.index()] }
            if (heaviest > 0.0) {
                return Pick(onBoard.filter { weights[it.index()] == heaviest }.random(random), source, weights)
            }
        }
        return Pick(onBoard.random(random), source = null, weights = null)
    }
}
