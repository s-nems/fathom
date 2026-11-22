package io.github.snems.fathom.arena.shooters

import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.github.snems.fathom.board.cells
import io.github.snems.fathom.board.edgeNeighbours
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.Shot
import jd.mg.ships.tournament.api.ShotResult.HIT
import jd.mg.ships.tournament.api.ShotResult.MISS
import jd.mg.ships.tournament.api.ShotResult.SUNK

/**
 * What a baseline shooter has learned from the results of its shots.
 */
internal class Sightings {
    /**
     * Hits on ships that are still afloat.
     */
    val openHits: Set<Position> get() = hits

    /**
     * Cells that hold no ship afloat: misses, sunk ships and the cells sharing an edge with them.
     */
    val closed: Set<Position> get() = closedCells

    var remainingSizes: List<Int> = FLEET_SHIP_SIZES
        private set

    private val hits = mutableSetOf<Position>()
    private val closedCells = mutableSetOf<Position>()

    fun record(shot: Shot) {
        when (shot.result) {
            MISS -> {
                closedCells += shot.position
            }

            HIT -> {
                hits += shot.position
            }

            SUNK -> {
                val ship = checkNotNull(shot.sunkShip)
                hits -= ship.cells().toSet()
                closedCells += ship.cells()
                closedCells += ship.edgeNeighbours()
                remainingSizes = remainingSizes - ship.size
            }
        }
    }
}
