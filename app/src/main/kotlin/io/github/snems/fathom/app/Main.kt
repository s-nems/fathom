package io.github.snems.fathom.app

import io.github.snems.fathom.bot.FathomBot
import io.github.snems.fathom.game.Game
import io.github.snems.fathom.game.Player
import java.nio.file.Files
import java.nio.file.Path
import java.time.Clock
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.random.Random

private val logger = System.getLogger("app")
private val FILE_STAMP = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss", Locale.ROOT)

internal fun logFileName(clock: Clock): String = "ships-game-${FILE_STAMP.format(LocalDateTime.now(clock))}.log"

/**
 * The bot with every move of it logged under the name of the player.
 */
private fun loggedBot(player: Player) = FathomBot(Random.Default, observer = BotLog(System.getLogger("$player")))

/**
 * Plays one game between two instances of the bot and writes its log to the working directory. A log of a game
 * started in the same second is overwritten. What each bot does on the way goes to the system logger.
 */
fun main() {
    logToStandardOutput()
    val clock = Clock.systemDefaultZone()
    val file = Path.of(logFileName(clock))
    Files.newBufferedWriter(file).use { out ->
        Game(loggedBot(Player.ONE), loggedBot(Player.TWO), Player.entries.random(), GameLogWriter(out, clock)).play()
    }
    logger.info("Game log written to ${file.toAbsolutePath()}")
}
