package io.github.snems.fathom.arena

import io.github.snems.fathom.board.Board
import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.github.snems.fathom.board.cells
import io.github.snems.fathom.board.edgeNeighbours
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement
import jd.mg.ships.tournament.api.Shot
import kotlin.random.Random

/** Shoots at any cell it has not shot at. Learns nothing. */
class RandomShooter(
    private val random: Random,
) : Shooter {
    override fun chooseShot(availablePositions: List<Position>): Position = availablePositions.random(random)
}

/**
 * Hunts at random until it hits, then follows the ship: the neighbours of a single hit, the two ends of a line
 * of hits. Skips the cells around sunk ships. With [parity] it hunts on one colour of the checkerboard.
 */
class HuntTargetShooter(
    private val random: Random,
    private val parity: Boolean,
) : Shooter {
    private val sightings = Sightings()

    override fun chooseShot(availablePositions: List<Position>): Position {
        val open = availablePositions.filter { it !in sightings.closed }.ifEmpty { availablePositions }
        return targets(open).ifEmpty { hunt(open) }.random(random)
    }

    override fun onShotResult(shot: Shot) = sightings.record(shot)

    private fun targets(open: List<Position>): List<Position> {
        val hit = sightings.openHits.firstOrNull() ?: return emptyList()
        val row = lineOfHits(hit) { Position(it.x + 1, it.y) to Position(it.x - 1, it.y) }
        val column = lineOfHits(hit) { Position(it.x, it.y + 1) to Position(it.x, it.y - 1) }
        val ends =
            when {
                row.hits > 1 -> row.ends
                column.hits > 1 -> column.ends
                else -> hit.edgeNeighbours()
            }
        return ends.filter { it in open }
    }

    /** The hits in a straight line through [hit] and the first cell past each end of that line. */
    private fun lineOfHits(
        hit: Position,
        steps: (Position) -> Pair<Position, Position>,
    ): Line {
        fun walk(next: (Position) -> Position): Pair<Int, Position> {
            var cell = next(hit)
            var hits = 0
            while (cell in sightings.openHits) {
                cell = next(cell)
                hits++
            }
            return hits to cell
        }
        val (forward, forwardEnd) = walk { steps(it).first }
        val (backward, backwardEnd) = walk { steps(it).second }
        return Line(hits = 1 + forward + backward, ends = listOf(forwardEnd, backwardEnd))
    }

    private fun hunt(open: List<Position>): List<Position> =
        if (parity) open.filter { (it.x + it.y) % CHECKERBOARD_COLOURS == 0 }.ifEmpty { open } else open

    private class Line(
        val hits: Int,
        val ends: List<Position>,
    )

    private companion object {
        const val CHECKERBOARD_COLOURS = 2
    }
}

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

    override fun chooseShot(availablePositions: List<Position>): Position {
        val density = density()
        val best = availablePositions.maxOf { density[it] ?: 0L }
        return availablePositions.filter { (density[it] ?: 0L) == best }.random(random)
    }

    override fun onShotResult(shot: Shot) = sightings.record(shot)

    private fun density(): Map<Position, Long> {
        val openHits = sightings.openHits
        val density = HashMap<Position, Long>()
        for (size in sightings.remainingSizes) {
            for ((ship, cells) in PLACEMENTS.getValue(size)) {
                if (cells.any { it in sightings.closed }) continue
                val hits = cells.count { it in openHits }
                if (hits == cells.size || (openHits.isNotEmpty() && hits == 0)) continue
                val weight = prior(ship) * weightOf(hits)
                cells.forEach { if (it !in openHits) density.merge(it, weight, Long::plus) }
            }
        }
        return density
    }

    private fun weightOf(hits: Int): Long = (0 until hits).fold(1L) { weight, _ -> weight * WEIGHT_PER_HIT }

    private companion object {
        const val WEIGHT_PER_HIT = 100L

        /** Every placement on the board with its cells, by ship size. */
        val PLACEMENTS: Map<Int, List<Pair<ShipPlacement, List<Position>>>> =
            FLEET_SHIP_SIZES.distinct().associateWith { size -> Board.placementsOf(size).map { it to it.cells() } }
    }
}
