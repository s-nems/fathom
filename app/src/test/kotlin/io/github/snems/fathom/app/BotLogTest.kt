package io.github.snems.fathom.app

import io.github.snems.fathom.bot.reporting.BotEvent.Failed
import io.github.snems.fathom.bot.reporting.BotEvent.LastResortShip
import io.github.snems.fathom.bot.reporting.BotEvent.LastResortShot
import io.github.snems.fathom.bot.reporting.BotEvent.ShipPlaced
import io.github.snems.fathom.bot.reporting.BotEvent.ShipRefused
import io.github.snems.fathom.bot.reporting.BotEvent.ShotChosen
import io.github.snems.fathom.bot.reporting.BotEvent.ShotRefused
import io.kotest.matchers.shouldBe
import jd.mg.ships.tournament.api.Direction.HORIZONTAL
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement
import org.junit.jupiter.api.Test
import java.lang.System.Logger
import java.lang.System.Logger.Level
import java.lang.System.Logger.Level.ERROR
import java.lang.System.Logger.Level.INFO
import java.lang.System.Logger.Level.WARNING
import java.util.ResourceBundle

class BotLogTest {
    private val logger = RecordingLogger()

    @Test
    fun shouldLogMovesAsInfoRefusalsAndLastResortsAsWarningsAndFailuresAsErrors() {
        // given
        val log = BotLog(logger)

        // when
        EVENTS.forEach(log::on)

        // then
        logger.levels shouldBe listOf(INFO, INFO) + List(WARNINGS) { WARNING } + ERROR
    }

    @Test
    fun shouldLeaveTheMovesOutWhenAskedTo() {
        // given
        val log = BotLog(logger, everyMove = false)

        // when
        EVENTS.forEach(log::on)

        // then
        logger.levels shouldBe List(WARNINGS) { WARNING } + ERROR
    }

    /**
     * Keeps the level of each line it is asked to write.
     */
    private class RecordingLogger : Logger {
        val levels = mutableListOf<Level>()

        override fun getName(): String = "recording"

        override fun isLoggable(level: Level): Boolean = true

        override fun log(
            level: Level,
            message: String?,
        ) {
            levels += level
        }

        override fun log(
            level: Level,
            message: String?,
            thrown: Throwable?,
        ) {
            levels += level
        }

        override fun log(
            level: Level,
            bundle: ResourceBundle?,
            message: String?,
            thrown: Throwable?,
        ) = Unit

        override fun log(
            level: Level,
            bundle: ResourceBundle?,
            format: String?,
            vararg parameters: Any?,
        ) = Unit
    }

    private companion object {
        val CELL = Position(3, 4)
        val SHIP = ShipPlacement(2, CELL, HORIZONTAL)
        const val WARNINGS = 4
        val EVENTS =
            listOf(
                ShipPlaced(SHIP),
                ShotChosen(CELL, source = "source", weights = null),
                ShipRefused(SHIP),
                ShotRefused(CELL),
                LastResortShip(SHIP),
                LastResortShot(CELL),
                Failed(IllegalStateException("broken")),
            )
    }
}
