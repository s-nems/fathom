package io.github.snems.fathom.bot.reporting

import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement

/**
 * Something the bot decided or ran into while answering the referee.
 */
sealed interface BotEvent {
    /**
     * The bot answered with the next ship of its plan.
     */
    data class ShipPlaced(
        val ship: ShipPlacement,
    ) : BotEvent

    /**
     * The bot answered with a shot. [source] names what weighed the cells, and [weights] holds the weight of every
     * cell, row by row from the top left corner. A shot at random has no weights. Not a data class, because an
     * array is equal only to itself.
     */
    class ShotChosen(
        val shot: Position,
        val source: String,
        val weights: DoubleArray?,
    ) : BotEvent

    /**
     * The referee asked for the same ship again, so it did not accept this one.
     */
    data class ShipRefused(
        val ship: ShipPlacement,
    ) : BotEvent

    /**
     * The referee offered the cell again, so it did not accept the shot at it.
     */
    data class ShotRefused(
        val shot: Position,
    ) : BotEvent

    /**
     * The bot found no ship within the rules and gave this one instead.
     */
    data class LastResortShip(
        val ship: ShipPlacement,
    ) : BotEvent

    /**
     * The bot found no shot within the rules and gave this one instead.
     */
    data class LastResortShot(
        val shot: Position,
    ) : BotEvent

    /**
     * The bot's own code threw. Where an answer was due, a last resort follows.
     */
    data class Failed(
        val failure: Throwable,
    ) : BotEvent
}
