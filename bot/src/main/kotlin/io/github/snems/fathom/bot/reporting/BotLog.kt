package io.github.snems.fathom.bot.reporting

import io.github.snems.fathom.bot.reporting.BotEvent.Failed
import io.github.snems.fathom.bot.reporting.BotEvent.LastResortShip
import io.github.snems.fathom.bot.reporting.BotEvent.LastResortShot
import io.github.snems.fathom.bot.reporting.BotEvent.ShipPlaced
import io.github.snems.fathom.bot.reporting.BotEvent.ShipRefused
import io.github.snems.fathom.bot.reporting.BotEvent.ShotChosen
import io.github.snems.fathom.bot.reporting.BotEvent.ShotRefused
import java.lang.System.Logger
import java.lang.System.Logger.Level.ERROR
import java.lang.System.Logger.Level.INFO
import java.lang.System.Logger.Level.WARNING

/**
 * Writes the events of a bot to a logger: every move as INFO, a refused answer or a last resort as WARNING, a
 * failure as ERROR. Without [everyMove] only the warnings and errors are written.
 */
class BotLog(
    private val logger: Logger,
    private val everyMove: Boolean = true,
) : BotObserver {
    override fun on(event: BotEvent) {
        when (event) {
            is ShipPlaced -> if (everyMove) logger.log(INFO, "Placed ${event.ship}")
            is ShotChosen -> if (everyMove) logger.log(INFO, "Shot at ${event.shot}, weighed by ${event.source}")
            is ShipRefused -> logger.log(WARNING, "The referee refused ${event.ship}")
            is ShotRefused -> logger.log(WARNING, "The referee refused ${event.shot}")
            is LastResortShip -> logger.log(WARNING, "No answer within the rules, last resort ${event.ship}")
            is LastResortShot -> logger.log(WARNING, "No answer within the rules, last resort ${event.shot}")
            is Failed -> logger.log(ERROR, "The bot's own code failed", event.failure)
        }
    }
}
