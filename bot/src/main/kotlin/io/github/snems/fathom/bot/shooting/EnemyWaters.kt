package io.github.snems.fathom.bot.shooting

import io.github.snems.fathom.board.Board
import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.github.snems.fathom.board.isOnBoard
import io.github.snems.fathom.bot.CELL_COUNT
import io.github.snems.fathom.bot.Candidate
import io.github.snems.fathom.bot.index
import jd.mg.ships.tournament.api.ShipPlacement
import jd.mg.ships.tournament.api.Shot
import jd.mg.ships.tournament.api.ShotResult

/**
 * What the results of the bot's shots say about the fleet it is shooting at.
 */
internal class EnemyWaters {
    /**
     * Cells that hold no ship afloat: misses, sunk ships and the cells sharing an edge with them.
     */
    private val closed = BooleanArray(CELL_COUNT)

    /**
     * Hits on ships that are still afloat.
     */
    private val openHit = BooleanArray(CELL_COUNT)

    /**
     * Sizes of the ships still afloat, largest first.
     */
    var afloat: List<Int> = FLEET_SHIP_SIZES
        private set

    var sunk: List<Candidate> = emptyList()
        private set

    val hasOpenHits: Boolean get() = openHit.any { it }

    fun openHits(): IntArray = (0..<CELL_COUNT).filter { openHit[it] }.toIntArray()

    /**
     * Takes in the result of a shot. A result for a cell off the board is ignored.
     */
    fun record(shot: Shot) {
        if (shot.position !in Board) return
        val sunkShip = shot.sunkShip?.takeIf { shot.result == ShotResult.SUNK && it.isOnBoard() }
        when {
            shot.result == ShotResult.MISS -> closed[shot.position.index()] = true

            sunkShip != null -> sink(sunkShip)

            // A hit, or a sinking that does not say which ship sank.
            else -> openHit[shot.position.index()] = true
        }
    }

    private fun sink(ship: ShipPlacement) {
        // A sinking reported a second time changes nothing.
        if (sunk.any { it.ship == ship }) return
        val candidate = Candidate.of(ship)
        candidate.cells.forEach {
            closed[it] = true
            openHit[it] = false
        }
        candidate.neighbours.forEach { closed[it] = true }
        afloat = afloat - ship.size
        sunk = sunk + candidate
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
