package io.github.snems.fathom.arena.shooters

import io.github.snems.fathom.board.Board
import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.github.snems.fathom.board.cells
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement
import jd.mg.ships.tournament.api.Shot
import kotlin.random.Random

/**
 * Shoots where the most placements of the ships afloat pass, counting each ship on its own. While a hit is open
 * it counts only placements through a hit, and a placement through more hits counts for much more. Skips sunk
 * ships and the cells around them. With a [prior] it counts a placement as many times as the prior says, which
 * models an opponent who knows how often the other side uses each placement.
 */
class DensityShooter(
    private val random: Random,
    private val prior: (ShipPlacement) -> Long = { 1L },
) : Shooter {
    private val sightings = Sightings()
    private var lastDensity: Map<Position, Long>? = null

    override fun chooseShot(availablePositions: List<Position>): Position {
        val density = density()
        lastDensity = density
        val best = availablePositions.maxOf { density[it] ?: 0L }
        return availablePositions.filter { (density[it] ?: 0L) == best }.random(random)
    }

    override fun onShotResult(shot: Shot) = sightings.record(shot)

    override fun weightsOfLastShot(): DoubleArray? =
        lastDensity?.let { density ->
            DoubleArray(Board.positions.size) {
                density[Board.positions[it]]?.toDouble()
                    ?: 0.0
            }
        }

    private fun density(): Map<Position, Long> {
        val openHits = sightings.openHits
        val density = HashMap<Position, Long>()
        for (size in sightings.remainingSizes) {
            for (placement in PLACEMENTS.getValue(size)) {
                val cells = placement.cells
                if (cells.any { it in sightings.closed }) continue
                val hits = cells.count { it in openHits }
                if (hits == cells.size || (openHits.isNotEmpty() && hits == 0)) continue
                val weight = prior(placement.ship) * weightOf(hits)
                cells.forEach { if (it !in openHits) density.merge(it, weight, Long::plus) }
            }
        }
        return density
    }

    private fun weightOf(hits: Int): Long = (0..<hits).fold(1L) { weight, _ -> weight * WEIGHT_PER_HIT }

    /**
     * A ship with its cells, worked out once.
     */
    private class Placement(
        val ship: ShipPlacement,
    ) {
        val cells: List<Position> = ship.cells()
    }

    private companion object {
        const val WEIGHT_PER_HIT = 100L

        /**
         * Every placement on the board, by ship size.
         */
        val PLACEMENTS: Map<Int, List<Placement>> =
            FLEET_SHIP_SIZES.distinct().associateWith { size -> Board.placementsOf(size).map(::Placement) }
    }
}
