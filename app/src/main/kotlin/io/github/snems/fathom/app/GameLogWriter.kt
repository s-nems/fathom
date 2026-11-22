package io.github.snems.fathom.app

import io.github.snems.fathom.game.GameEvent
import io.github.snems.fathom.game.GameEvent.BotFailed
import io.github.snems.fathom.game.GameEvent.GameOver
import io.github.snems.fathom.game.GameEvent.ShipPlaced
import io.github.snems.fathom.game.GameEvent.ShotFired
import io.github.snems.fathom.game.GameObserver
import io.github.snems.fathom.game.Player
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement
import jd.mg.ships.tournament.api.Shot
import jd.mg.ships.tournament.api.ShotResult.HIT
import jd.mg.ships.tournament.api.ShotResult.MISS
import jd.mg.ships.tournament.api.ShotResult.SUNK
import java.time.Clock
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * Writes a game as player one saw it: its own ships, every shot of both players, the outcome, and the ships of
 * the opponent once the game is over. Each line starts with the time it was written. Failed moves are left out.
 */
internal class GameLogWriter(
    private val out: Appendable,
    private val clock: Clock,
) : GameObserver {
    override fun on(event: GameEvent) {
        when (event) {
            is ShipPlaced -> if (event.player == VIEWER) line("place-ship: ${describe(event.ship)}")
            is ShotFired -> line("${if (event.player == VIEWER) "shot" else "enemy-shot"}: ${describe(event.shot)}")
            is GameOver -> gameOver(event)
            is BotFailed -> Unit
        }
    }

    private fun gameOver(event: GameOver) {
        val result = event.result
        val outcome = if (result.winner == VIEWER) "win" else "loss"
        val shots = result.shotsBy(VIEWER)
        val enemyShots = result.shotsBy(VIEWER.opponent)
        line("game-over: result=$outcome total-shots=$shots enemy-total-shots=$enemyShots")
        result.fleetOf(VIEWER.opponent).forEach { line("enemy-ship: ${describe(it)}") }
    }

    private fun line(text: String) {
        out.append(TIME.format(LocalTime.now(clock)))
            .append(' ')
            .append(text)
            .append('\n')
    }

    private fun describe(ship: ShipPlacement) =
        "size=${ship.size} ${describe(ship.position)} dir=${ship.direction.name.lowercase()}"

    private fun describe(shot: Shot): String {
        val result =
            when (shot.result) {
                MISS -> "miss"
                HIT -> "hit"
                SUNK -> "sunk ship-size=${checkNotNull(shot.sunkShip).size}"
            }
        return "${describe(shot.position)} result=$result"
    }

    private fun describe(position: Position) = "pos=(${position.x},${position.y})"

    private companion object {
        val VIEWER = Player.ONE
        val TIME = DateTimeFormatter.ofPattern("HH:mm:ss.SSS", Locale.ROOT)
    }
}
