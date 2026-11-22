package io.github.snems.fathom.arena.shooters

import io.github.snems.fathom.board.edgeNeighbours
import jd.mg.ships.tournament.api.Direction
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.Shot
import kotlin.random.Random

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
        val row = lineOfHits(hit, Direction.HORIZONTAL)
        val column = lineOfHits(hit, Direction.VERTICAL)
        val ends =
            when {
                row.hits > 1 -> row.ends
                column.hits > 1 -> column.ends
                else -> hit.edgeNeighbours()
            }
        return ends.filter { it in open }
    }

    /**
     * The hits in a straight line through [hit] and the first cell past each end of that line.
     */
    private fun lineOfHits(
        hit: Position,
        direction: Direction,
    ): Line {
        val ahead = hitsFrom(hit, direction, AHEAD)
        val behind = hitsFrom(hit, direction, BEHIND)
        return Line(
            // Both ways start at the hit itself.
            hits = ahead.size + behind.size - 1,
            ends = listOf(ahead.last().moved(direction, AHEAD), behind.last().moved(direction, BEHIND)),
        )
    }

    /**
     * The hits one after another from [hit] on, itself first, going one way along the direction.
     */
    private fun hitsFrom(
        hit: Position,
        direction: Direction,
        step: Int,
    ): List<Position> =
        generateSequence(hit) { it.moved(direction, step) }.takeWhile { it in sightings.openHits }.toList()

    private fun Position.moved(
        direction: Direction,
        step: Int,
    ): Position =
        when (direction) {
            Direction.HORIZONTAL -> Position(x + step, y)
            Direction.VERTICAL -> Position(x, y + step)
        }

    private fun hunt(open: List<Position>): List<Position> =
        if (parity) open.filter { (it.x + it.y) % CHECKERBOARD_COLOURS == 0 }.ifEmpty { open } else open

    /**
     * Hits in a straight line, with the first cell past each end of it.
     */
    private class Line(
        val hits: Int,
        val ends: List<Position>,
    )

    private companion object {
        const val CHECKERBOARD_COLOURS = 2
        const val AHEAD = 1
        const val BEHIND = -1
    }
}
