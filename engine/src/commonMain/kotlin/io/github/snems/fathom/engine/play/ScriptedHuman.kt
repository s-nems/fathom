package io.github.snems.fathom.engine.play

import io.github.snems.fathom.arena.shooters.Shooter
import jd.mg.ships.tournament.api.Position

/**
 * The shooter of a human whose shots so far are known. Once they are used up it has no answer, which the
 * referee ends with a forfeit, and [isWaiting] tells that the game stopped for the human and not for good.
 */
internal class ScriptedHuman(
    private val shots: List<Position>,
) : Shooter {
    private var fired = 0

    var isWaiting = false
        private set

    val hasShotsLeft: Boolean get() = fired < shots.size

    override fun chooseShot(availablePositions: List<Position>): Position {
        isWaiting = !hasShotsLeft
        check(!isWaiting) { "The human has not chosen the next shot yet" }
        return shots[fired++]
    }
}
