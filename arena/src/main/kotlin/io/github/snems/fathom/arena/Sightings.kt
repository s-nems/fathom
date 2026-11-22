package io.github.snems.fathom.arena

import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.github.snems.fathom.board.cells
import io.github.snems.fathom.board.edgeNeighbours
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.Shot
import jd.mg.ships.tournament.api.ShotResult

/** What a baseline shooter has learned from the results of its shots. */
class Sightings {
    /** Hits on ships that are still afloat. */
    val openHits: Set<Position> get() = hits

    /** Cells that hold no ship afloat: misses, sunk ships and the cells sharing an edge with them. */
    val closed: Set<Position> get() = closedCells

    /** Sizes of the ships still afloat. */
    val remainingSizes: List<Int> get() = sizes

    private val hits = mutableSetOf<Position>()
    private val closedCells = mutableSetOf<Position>()
    private var sizes = FLEET_SHIP_SIZES

    fun record(shot: Shot) {
        when (shot.result) {
            ShotResult.MISS -> {
                closedCells += shot.position
            }

            ShotResult.HIT -> {
                hits += shot.position
            }

            ShotResult.SUNK -> {
                val ship = checkNotNull(shot.sunkShip)
                hits -= ship.cells().toSet()
                closedCells += ship.cells()
                closedCells += ship.edgeNeighbours()
                sizes = sizes - ship.size
            }
        }
    }
}
