package io.github.snems.fathom.arena

import io.github.snems.fathom.game.Game
import io.github.snems.fathom.game.Player
import jd.mg.ships.tournament.api.Bot
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement
import jd.mg.ships.tournament.api.Shot
import java.lang.System.Logger.Level
import java.util.Locale
import kotlin.random.Random
import kotlin.time.Duration
import kotlin.time.DurationUnit
import kotlin.time.measureTimedValue

private val log = System.getLogger("arena")
private const val COLUMN = 16

/**
 * Plays whole games of a bot against itself through the referee and prints the longest call of each kind, as
 * the referee would time it. The first game runs on a JVM that has not seen the code, which is the worst case.
 */
fun printMoveTimes(
    bot: (Random) -> Bot,
    games: Int,
    seed: Long,
) {
    log.log(Level.INFO, "Longest call in milliseconds, game by game. The referee allows ${Game.MOVE_TIME_LIMIT}.")
    log.log(
        Level.INFO,
        "game".padEnd(COLUMN) + Call.entries.joinToString("") { it.heading.padStart(COLUMN) } +
            "ending".padStart(COLUMN),
    )
    val random = Random(seed)
    repeat(games) { game ->
        val longest = mutableMapOf<Call, Duration>()
        val result = Game(TimedBot(bot(random), longest), TimedBot(bot(random), longest), Player.ONE).play()
        val cells =
            Call.entries.map {
                "%.1f".format(Locale.ROOT, longest.getValue(it).toDouble(DurationUnit.MILLISECONDS))
            }
        log.log(
            Level.INFO,
            "${game + 1}".padEnd(COLUMN) + cells.joinToString("") { it.padStart(COLUMN) } +
                "${result.ending}".padStart(COLUMN),
        )
    }
}

/**
 * Passes every call on to a bot and keeps the longest time each kind of call took.
 */
private class TimedBot(
    private val bot: Bot,
    private val longest: MutableMap<Call, Duration>,
) : Bot {
    override fun placeShip(
        ownFleet: List<ShipPlacement>,
        remainingShipSizes: List<Int>,
    ): ShipPlacement = timed(Call.PLACE_SHIP) { bot.placeShip(ownFleet, remainingShipSizes) }

    override fun chooseShot(availablePositions: List<Position>): Position =
        timed(Call.CHOOSE_SHOT) { bot.chooseShot(availablePositions) }

    override fun onShotResult(shot: Shot) = timed(Call.ON_SHOT_RESULT) { bot.onShotResult(shot) }

    private fun <T> timed(
        call: Call,
        action: () -> T,
    ): T {
        val (answer, time) = measureTimedValue(action)
        longest.merge(call, time) { before, now -> maxOf(before, now) }
        return answer
    }
}

/**
 * A method of a bot the referee times, with its name as the heading of its column.
 */
private enum class Call(
    val heading: String,
) {
    PLACE_SHIP("placeShip"),
    CHOOSE_SHOT("chooseShot"),
    ON_SHOT_RESULT("onShotResult"),
}
