package io.github.snems.fathom.engine.games

import io.github.snems.fathom.arena.shooters.Shooter
import jd.mg.ships.tournament.api.Bot
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement
import jd.mg.ships.tournament.api.Shot
import kotlin.time.Duration
import kotlin.time.TimeSource
import kotlin.time.measureTimedValue

/**
 * One side of a recorded game as the referee sees it: a bot that places a given fleet, shoots as a shooter and
 * times each choice.
 */
internal class Side(
    private val fleet: List<ShipPlacement>,
    private val shooter: Shooter,
    private val timeSource: TimeSource,
) : Bot {
    /**
     * How long the shooter took over its last choice.
     */
    var lastChoice: Duration = Duration.ZERO
        private set

    fun weightsOfLastShot(): DoubleArray? = shooter.weightsOfLastShot()

    override fun placeShip(
        ownFleet: List<ShipPlacement>,
        remainingShipSizes: List<Int>,
    ): ShipPlacement = fleet[ownFleet.size]

    override fun chooseShot(availablePositions: List<Position>): Position {
        val (position, time) = timeSource.measureTimedValue { shooter.chooseShot(availablePositions) }
        lastChoice = time
        return position
    }

    override fun onShotResult(shot: Shot) = shooter.onShotResult(shot)
}
