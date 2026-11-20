package io.github.snems.fathom.bot

import io.github.snems.fathom.board.Board
import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.github.snems.fathom.board.isOnBoard
import jd.mg.ships.tournament.api.ShipPlacement
import jd.mg.ships.tournament.api.Shot
import jd.mg.ships.tournament.api.ShotResult

/** What the results of the bot's shots say about the fleet it is shooting at. */
internal class EnemyWaters {
    /** Cells that hold no ship afloat: misses, sunk ships and the cells sharing an edge with them. */
    private val closed = BooleanArray(CELL_COUNT)

    /** Hits on ships that are still afloat. */
    private val openHit = BooleanArray(CELL_COUNT)

    /** Sizes of the ships still afloat, largest first. */
    var afloat: List<Int> = FLEET_SHIP_SIZES
        private set

    val hasOpenHits: Boolean get() = openHit.any { it }

    /** Takes in the result of a shot. A result for a cell off the board is ignored. */
    fun record(shot: Shot) {
        if (shot.position !in Board) return
        val sunk = shot.sunkShip?.takeIf { shot.result == ShotResult.SUNK && it.isOnBoard() }
        when {
            shot.result == ShotResult.MISS -> closed[shot.position.index()] = true

            sunk != null -> sink(sunk)

            // A hit, or a sinking that does not say which ship sank.
            else -> openHit[shot.position.index()] = true
        }
    }

    private fun sink(ship: ShipPlacement) {
        val sunk = Candidate.of(ship)
        sunk.cells.forEach {
            closed[it] = true
            openHit[it] = false
        }
        sunk.neighbours.forEach { closed[it] = true }
        afloat = afloat - ship.size
    }

    /**
     * Whether a ship afloat may lie there. It may not cover a closed cell, and it may not have a hit next to it:
     * that hit would belong to another ship sharing an edge with this one.
     */
    fun allows(candidate: Candidate): Boolean =
        candidate.cells.none { closed[it] } && candidate.neighbours.none { openHit[it] }

    fun isOpenHit(cell: Int): Boolean = openHit[cell]

    fun passesThroughHit(candidate: Candidate): Boolean = candidate.cells.any { openHit[it] }
}
