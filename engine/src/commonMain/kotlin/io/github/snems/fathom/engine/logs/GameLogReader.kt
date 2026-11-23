package io.github.snems.fathom.engine.logs

import io.github.snems.fathom.board.cells
import io.github.snems.fathom.engine.board.Ship
import io.github.snems.fathom.engine.games.GameRecord
import io.github.snems.fathom.engine.games.Outcome
import io.github.snems.fathom.engine.games.ShotRecord
import io.github.snems.fathom.game.GameResult.Ending
import io.github.snems.fathom.game.Player
import jd.mg.ships.tournament.api.ShotResult

/**
 * Reads the log of a game back into a record. Player one is the player whose log it is. A log names only the
 * size of a sunk ship, so the ship itself is looked up in the fleet, which for the opponent is known only once
 * the game is over.
 */
internal object GameLogReader {
    private const val LOGGING_PLAYER = "the logging player"
    private const val OPPONENT = "the opponent"

    /**
     * @throws IllegalArgumentException if a line is not a line of a game log
     */
    fun read(
        title: String,
        text: String,
    ): GameRecord {
        val lines = text.lines().filter { it.isNotBlank() }.map(::LogLine)
        val fleets = Player.entries.associateWith { player -> lines.filter { it.owner == player }.map { it.ship() } }
        val shots = lines.filter { it.shooter != null }.map { shotOf(it, fleets) }
        return GameRecord(
            title = title,
            players = mapOf(Player.ONE to LOGGING_PLAYER, Player.TWO to OPPONENT),
            fleets = fleets,
            shots = shots,
            result = lines.firstOrNull { it.endsGame }?.let { outcomeOf(it, fleets, shots) },
        )
    }

    private fun shotOf(
        line: LogLine,
        fleets: Map<Player, List<Ship>>,
    ): ShotRecord {
        val player = checkNotNull(line.shooter)
        val position = line.position()
        val result = line.result()
        val target = fleets.getValue(player.opponent)
        return ShotRecord(
            player = player,
            x = position.x,
            y = position.y,
            result = result,
            sunk = target.takeIf { result == ShotResult.SUNK }?.firstOrNull { position in it.placement().cells() },
            weights = null,
            millis = null,
            at = line.time,
        )
    }

    /**
     * A log does not say why its game ended. The fleet was sunk when the winner struck every cell of it.
     */
    private fun outcomeOf(
        line: LogLine,
        fleets: Map<Player, List<Ship>>,
        shots: List<ShotRecord>,
    ): Outcome {
        val winner = line.winner()
        val struck = shots.filter { it.player == winner }.map { it.position() }.toSet()
        val hulls = fleets.getValue(winner.opponent).flatMap { it.placement().cells() }
        val ending = Ending.FLEET_SUNK.takeIf { hulls.isNotEmpty() && struck.containsAll(hulls) }
        return Outcome(winner, ending, line.totalShots())
    }
}
