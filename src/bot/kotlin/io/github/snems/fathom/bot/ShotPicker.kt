package io.github.snems.fathom.bot

import io.github.snems.fathom.board.Board
import jd.mg.ships.tournament.api.Position
import kotlin.random.Random

/**
 * Picks the next shot: the cell that the most placements of the ships afloat pass over, each ship counted on
 * its own. While a hit is open, only placements through a hit count, so the bot finishes the ship it has found.
 */
internal class ShotPicker(
    private val waters: EnemyWaters,
    private val random: Random,
) {
    /** The heaviest of the offered cells, at random among equals. Cells off the board are not considered. */
    fun pick(offered: List<Position>): Position {
        val onBoard = offered.filter { it in Board }
        val weights = weights()
        val heaviest = onBoard.maxOf { weights[it.index()] }
        return onBoard.filter { weights[it.index()] == heaviest }.random(random)
    }

    /** Weight of every cell by its index. A cell that is already hit weighs nothing. */
    fun weights(): IntArray {
        val throughHits = count(throughHitsOnly = waters.hasOpenHits)
        // Results that fit no legal fleet can leave nothing through the hits. Then every placement counts.
        return if (throughHits.any { it > 0 }) throughHits else count(throughHitsOnly = false)
    }

    private fun count(throughHitsOnly: Boolean): IntArray {
        val weights = IntArray(CELL_COUNT)
        for (size in waters.afloat) {
            for (candidate in Candidate.BY_SIZE.getValue(size)) {
                if (!waters.allows(candidate)) continue
                if (throughHitsOnly && !waters.passesThroughHit(candidate)) continue
                candidate.cells.forEach { if (!waters.isOpenHit(it)) weights[it]++ }
            }
        }
        return weights
    }
}
