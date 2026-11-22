package io.github.snems.fathom.arena.shooters

import jd.mg.ships.tournament.api.Position
import kotlin.random.Random

/**
 * Shoots at any cell it has not shot at. Learns nothing.
 */
class RandomShooter(
    private val random: Random,
) : Shooter {
    override fun chooseShot(availablePositions: List<Position>): Position = availablePositions.random(random)
}
