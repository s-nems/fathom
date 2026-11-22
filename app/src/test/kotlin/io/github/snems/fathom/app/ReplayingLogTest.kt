package io.github.snems.fathom.app

import io.github.snems.fathom.ScriptedBot
import io.github.snems.fathom.game.Game
import io.github.snems.fathom.game.Player
import io.kotest.matchers.collections.shouldNotBeEmpty
import io.kotest.matchers.shouldBe
import jd.mg.ships.tournament.api.Direction
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement
import org.junit.jupiter.api.DynamicTest
import org.junit.jupiter.api.DynamicTest.dynamicTest
import org.junit.jupiter.api.TestFactory
import java.nio.file.Files
import java.nio.file.Path
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZoneOffset
import kotlin.io.path.name
import kotlin.io.path.readText

/**
 * Every log in the `logs` test resources is played again: two scripted bots repeat its ships and shots through
 * the real referee, and the log written for that game has to match the original byte for byte.
 */
class ReplayingLogTest {
    @TestFactory
    fun shouldWriteTheSameLogWhenTheGameIsPlayedAgain(): List<DynamicTest> {
        val logs = Files.list(LOGS).use { files -> files.sorted().toList() }
        logs.shouldNotBeEmpty()
        return logs.map { log -> dynamicTest(log.name) { replay(log.readText()) shouldBe log.readText() } }
    }

    private fun replay(original: String): String {
        // given
        val lines = original.lines().filter { it.isNotEmpty() }.map(::LogLine)
        val playerOne = ScriptedBot(lines.shipsOf("place-ship"), lines.shotsOf("shot"))
        val playerTwo = ScriptedBot(lines.shipsOf("enemy-ship"), lines.shotsOf("enemy-shot"))
        val firstShot = lines.first { it.kind == "shot" || it.kind == "enemy-shot" }
        val firstShooter = if (firstShot.kind == "shot") Player.ONE else Player.TWO
        val replayed = StringBuilder()

        // when
        Game(playerOne, playerTwo, firstShooter, GameLogWriter(replayed, ScriptedClock(lines.map { it.time }))).play()

        // then
        return replayed.toString()
    }

    private fun List<LogLine>.shipsOf(kind: String) = filter { it.kind == kind }.map { it.ship() }

    private fun List<LogLine>.shotsOf(kind: String) = filter { it.kind == kind }.map { it.position() }

    private class LogLine(
        line: String,
    ) {
        val time: LocalTime
        val kind: String
        private val details: String

        init {
            val (time, kind, details) = checkNotNull(LINE.matchEntire(line)) { "Unexpected line: $line" }.destructured
            this.time = LocalTime.parse(time)
            this.kind = kind
            this.details = details
        }

        fun position(): Position {
            val (x, y) = checkNotNull(POSITION.find(details)).destructured
            return Position(x.toInt(), y.toInt())
        }

        fun ship(): ShipPlacement {
            val (size, direction) = checkNotNull(SHIP.find(details)).destructured
            return ShipPlacement(size.toInt(), position(), Direction.valueOf(direction.uppercase()))
        }
    }

    /** Answers with the times of the original lines, one per line written. */
    private class ScriptedClock(
        times: List<LocalTime>,
    ) : Clock() {
        private val times = ArrayDeque(times)

        override fun getZone(): ZoneId = ZoneOffset.UTC

        override fun withZone(zone: ZoneId): Clock = this

        override fun instant(): Instant = LocalDate.EPOCH.atTime(times.removeFirst()).toInstant(ZoneOffset.UTC)
    }

    private companion object {
        val LOGS: Path = Path.of("src/test/resources/logs")
        val LINE = Regex("""(\d\d:\d\d:\d\d\.\d{3}) ([a-z-]+): (.*)""")
        val POSITION = Regex("""pos=\((\d+),(\d+)\)""")
        val SHIP = Regex("""size=(\d+) .* dir=([a-z]+)""")
    }
}
