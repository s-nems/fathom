package io.github.snems.fathom.arena

import io.github.snems.fathom.game.Game
import io.github.snems.fathom.game.Player
import jd.mg.ships.tournament.api.Bot
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement
import jd.mg.ships.tournament.api.Shot
import java.util.Locale
import kotlin.random.Random
import kotlin.time.Duration
import kotlin.time.DurationUnit
import kotlin.time.measureTimedValue

/**
 * Plays whole games of a bot against itself through the referee and prints the longest call of each kind, as
 * the referee would time it. The first game runs on a JVM that has not seen the code, which is the worst case.
 */
fun printMoveTimes(
    bot: (Random) -> Bot,
    games: Int,
    seed: Long,
) {
    println("Longest call in milliseconds, game by game. The referee allows ${Game.MOVE_TIME_LIMIT}.")
    println("game".padEnd(COLUMN) + CALLS.joinToString("") { it.padStart(COLUMN) } + "ending".padStart(COLUMN))
    val random = Random(seed)
    repeat(games) { game ->
        val longest = mutableMapOf<String, Duration>()
        val result = Game(TimedBot(bot(random), longest), TimedBot(bot(random), longest), Player.ONE).play()
        val cells = CALLS.map { "%.1f".format(Locale.ROOT, longest.getValue(it).toDouble(DurationUnit.MILLISECONDS)) }
        println(
            "${game + 1}".padEnd(COLUMN) + cells.joinToString("") { it.padStart(COLUMN) } +
                "${result.ending}".padStart(COLUMN),
        )
    }
}

/** Passes every call on to a bot and keeps the longest time each kind of call took. */
private class TimedBot(
    private val bot: Bot,
    private val longest: MutableMap<String, Duration>,
) : Bot {
    override fun placeShip(
        ownFleet: List<ShipPlacement>,
        remainingShipSizes: List<Int>,
    ): ShipPlacement = timed(PLACE_SHIP) { bot.placeShip(ownFleet, remainingShipSizes) }

    override fun chooseShot(availablePositions: List<Position>): Position =
        timed(CHOOSE_SHOT) { bot.chooseShot(availablePositions) }

    override fun onShotResult(shot: Shot) = timed(ON_SHOT_RESULT) { bot.onShotResult(shot) }

    private fun <T> timed(
        call: String,
        action: () -> T,
    ): T {
        val (answer, time) = measureTimedValue(action)
        longest.merge(call, time) { before, now -> maxOf(before, now) }
        return answer
    }
}

private const val PLACE_SHIP = "placeShip"
private const val CHOOSE_SHOT = "chooseShot"
private const val ON_SHOT_RESULT = "onShotResult"
private val CALLS = listOf(PLACE_SHIP, CHOOSE_SHOT, ON_SHOT_RESULT)
private const val COLUMN = 16
