package io.github.snems.fathom.arena

import jd.mg.ships.tournament.api.Bot
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.Shot

/** The shooting half of a bot. */
interface Shooter {
    fun chooseShot(availablePositions: List<Position>): Position

    fun onShotResult(shot: Shot) = Unit
}

/** The shooting half of this bot. */
fun Bot.asShooter(): Shooter =
    object : Shooter {
        override fun chooseShot(availablePositions: List<Position>) = this@asShooter.chooseShot(availablePositions)

        override fun onShotResult(shot: Shot) = this@asShooter.onShotResult(shot)
    }
