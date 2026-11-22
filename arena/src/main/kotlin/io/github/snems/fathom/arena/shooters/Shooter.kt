package io.github.snems.fathom.arena.shooters

import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.Shot
import kotlin.random.Random

/**
 * The shooting half of a bot.
 */
interface Shooter {
    fun chooseShot(availablePositions: List<Position>): Position

    fun onShotResult(shot: Shot) = Unit

    /**
     * The weight the shooter gave every cell before its last shot, row by row from the top left corner. Null
     * when it weighed nothing.
     */
    fun weightsOfLastShot(): DoubleArray? = null
}

/**
 * Makes a fresh shooter for each fleet it is to sink.
 */
typealias ShooterFactory = (Random) -> Shooter
