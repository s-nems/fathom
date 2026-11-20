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

private val FILE_STAMP = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss", Locale.ROOT)

/** Name of the log file of a game that starts now. */
internal fun logFileName(clock: Clock): String = "ships-game-${FILE_STAMP.format(LocalDateTime.now(clock))}.log"

/**
 * Plays one game between two instances of the bot and writes its log to the working directory. A log of a game
 * started in the same second is overwritten.
 */
fun main() {
    val clock = Clock.systemDefaultZone()
    val log = Path.of(logFileName(clock))
    Files.newBufferedWriter(log).use { out ->
        Game(FathomBot(), FathomBot(), firstShooter = Player.entries.random(), GameLogWriter(out, clock)).play()
    }
    println("Game log written to $log")
}
