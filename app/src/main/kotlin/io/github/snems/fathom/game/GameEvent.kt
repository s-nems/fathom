package io.github.snems.fathom.game

import jd.mg.ships.tournament.api.ShipPlacement
import jd.mg.ships.tournament.api.Shot

/**
 * Something that happened in a game, reported in the order it happened.
 */
sealed interface GameEvent {
    /**
     * The referee accepted a ship of the player.
     */
    data class ShipPlaced(
        val player: Player,
        val ship: ShipPlacement,
    ) : GameEvent

    /**
     * A valid shot and its result.
     */
    data class ShotFired(
        val player: Player,
        val shot: Shot,
    ) : GameEvent

    /**
     * The bot of the player threw, or gave an answer the rules do not allow.
     */
    data class BotFailed(
        val player: Player,
        val error: Exception?,
    ) : GameEvent

    /**
     * The last event of a game.
     */
    data class GameOver(
        val result: GameResult,
    ) : GameEvent
}

/**
 * Receives the events of a game while it is played.
 */
fun interface GameObserver {
    fun on(event: GameEvent)
}
