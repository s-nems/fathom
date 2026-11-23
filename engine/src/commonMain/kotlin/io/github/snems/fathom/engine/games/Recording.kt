package io.github.snems.fathom.engine.games

import io.github.snems.fathom.engine.board.Ship
import io.github.snems.fathom.game.Game
import io.github.snems.fathom.game.GameEvent
import io.github.snems.fathom.game.GameEvent.BotFailed
import io.github.snems.fathom.game.GameEvent.GameOver
import io.github.snems.fathom.game.GameEvent.ShipPlaced
import io.github.snems.fathom.game.GameEvent.ShotFired
import io.github.snems.fathom.game.GameObserver
import io.github.snems.fathom.game.Player
import kotlin.time.DurationUnit

/**
 * One game at the referee and the record of it. While the game is on, the record may be read whenever the game
 * waits for a side, and it guards nothing itself. The referee does not hold the sides to the time limit: the
 * shooters of the catalogue have no time budget, and a human needs longer than a bot.
 */
internal class Recording(
    private val names: Map<Player, String>,
    private val sides: Map<Player, Side>,
) : GameObserver {
    private val title = Player.entries.joinToString(VERSUS) { names.getValue(it) }
    private val fleets = Player.entries.associateWith { mutableListOf<Ship>() }
    private val shots = mutableListOf<ShotRecord>()
    private var outcome: Outcome? = null

    fun play(firstShooter: Player) {
        Game(sides.getValue(Player.ONE), sides.getValue(Player.TWO), firstShooter, this, StoppedClock).play()
    }

    fun record() = GameRecord(title, names, fleets.mapValues { (_, ships) -> ships.toList() }, shots.toList(), outcome)

    override fun on(event: GameEvent) {
        when (event) {
            is ShipPlaced -> fleets.getValue(event.player) += Ship.of(event.ship)
            is ShotFired -> shots += recordOf(event)
            is GameOver -> outcome = outcomeOf(event)
            is BotFailed -> Unit
        }
    }

    private fun recordOf(event: ShotFired): ShotRecord {
        val side = sides.getValue(event.player)
        return ShotRecord(
            player = event.player,
            x = event.shot.position.x,
            y = event.shot.position.y,
            result = event.shot.result,
            sunk = event.shot.sunkShip?.let(Ship::of),
            weights = side.weightsOfLastShot()?.asList(),
            millis = side.lastChoice.toDouble(DurationUnit.MILLISECONDS),
            at = null,
        )
    }

    private fun outcomeOf(event: GameOver) =
        Outcome(event.result.winner, event.result.ending, Player.entries.associateWith(event.result::shotsBy))

    private companion object {
        const val VERSUS = " vs "
    }
}
