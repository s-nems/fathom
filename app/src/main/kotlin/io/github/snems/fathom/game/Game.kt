package io.github.snems.fathom.game

import io.github.snems.fathom.game.GameEvent.BotFailed
import io.github.snems.fathom.game.GameEvent.GameOver
import io.github.snems.fathom.game.GameEvent.ShipPlaced
import io.github.snems.fathom.game.GameEvent.ShotFired
import io.github.snems.fathom.game.GameResult.Ending
import io.github.snems.fathom.game.GameResult.Ending.FLEET_SUNK
import io.github.snems.fathom.game.GameResult.Ending.ILLEGAL_MOVES
import io.github.snems.fathom.game.GameResult.Ending.TIME_LIMIT
import jd.mg.ships.tournament.api.Bot
import jd.mg.ships.tournament.api.Shot
import kotlin.time.Duration
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.TimeSource
import kotlin.time.measureTime
import kotlin.time.measureTimedValue

/**
 * One game between two bots, refereed by the tournament rules: both place their fleets, then they shoot in turns
 * until one fleet is sunk. A bot that throws or answers illegally is asked again. It forfeits after three such
 * answers in a row, or after one call that takes longer than the time limit.
 */
class Game(
    playerOne: Bot,
    playerTwo: Bot,
    private val firstShooter: Player,
    private val observer: GameObserver = GameObserver { },
    private val timeSource: TimeSource = TimeSource.Monotonic,
) {
    private val seats = mapOf(Player.ONE to Seat(playerOne), Player.TWO to Seat(playerTwo))
    private var played = false

    /**
     * @throws IllegalStateException if the game has been played already
     */
    fun play(): GameResult {
        check(!played) { "A game is played once" }
        played = true
        val result =
            try {
                placeFleets()
                shootOut()
            } catch (forfeit: Forfeit) {
                resultOf(forfeit.player.opponent, forfeit.ending)
            }
        observer.on(GameOver(result))
        return result
    }

    private fun placeFleets() {
        for (player in Player.entries) {
            val seat = seatOf(player)
            while (!seat.fleet.isComplete) {
                val fleet = seat.fleet
                val ship = ask(player, fleet::accepts) { placeShip(fleet.ships, fleet.remainingSizes) }
                seat.fleet = fleet.place(ship)
                observer.on(ShipPlaced(player, ship))
            }
        }
    }

    private fun shootOut(): GameResult {
        val targets = seats.mapValues { (_, seat) -> FleetUnderFire(seat.fleet) }
        var shooter = firstShooter
        while (true) {
            val target = targets.getValue(shooter.opponent)
            val position = ask(shooter, target::accepts) { chooseShot(target.unshot()) }
            val shot = target.receive(position)
            seatOf(shooter).shotsFired++
            observer.on(ShotFired(shooter, shot))
            val toldInTime = tell(shooter, shot)
            if (target.isSunk) return resultOf(shooter, FLEET_SUNK)
            if (!toldInTime) throw Forfeit(shooter, TIME_LIMIT)
            shooter = shooter.opponent
        }
    }

    /**
     * The first legal answer of the bot.
     */
    private fun <T : Any> ask(
        player: Player,
        isLegal: (T) -> Boolean,
        question: Bot.() -> T,
    ): T {
        repeat(ILLEGAL_MOVES_TO_FORFEIT) {
            var error: Exception? = null
            val (answer, time) =
                timeSource.measureTimedValue {
                    try {
                        seatOf(player).bot.question()
                    } catch (thrown: Exception) {
                        error = thrown
                        null
                    }
                }
            if (time > MOVE_TIME_LIMIT) throw Forfeit(player, TIME_LIMIT)
            if (answer != null && isLegal(answer)) return answer
            observer.on(BotFailed(player, error))
        }
        throw Forfeit(player, ILLEGAL_MOVES)
    }

    /**
     * Passes the result of a shot to the bot that fired it. False when the bot took too long over it.
     */
    private fun tell(
        player: Player,
        shot: Shot,
    ): Boolean {
        val time =
            timeSource.measureTime {
                try {
                    seatOf(player).bot.onShotResult(shot)
                } catch (thrown: Exception) {
                    observer.on(BotFailed(player, thrown))
                }
            }
        return time <= MOVE_TIME_LIMIT
    }

    private fun seatOf(player: Player): Seat = seats.getValue(player)

    private fun resultOf(
        winner: Player,
        ending: Ending,
    ) = GameResult(
        winner = winner,
        ending = ending,
        shots = seats.mapValues { (_, seat) -> seat.shotsFired },
        fleets = seats.mapValues { (_, seat) -> seat.fleet.ships },
    )

    /**
     * What the referee keeps about one player.
     */
    private class Seat(
        val bot: Bot,
    ) {
        var fleet = Fleet.EMPTY
        var shotsFired = 0
    }

    /**
     * Ends the game from wherever the bot of the player lost it. Never leaves this class.
     */
    private class Forfeit(
        val player: Player,
        val ending: Ending,
    ) : Exception()

    companion object {
        val MOVE_TIME_LIMIT: Duration = 500.milliseconds
        const val ILLEGAL_MOVES_TO_FORFEIT = 3
    }
}
