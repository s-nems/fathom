package io.github.snems.fathom.engine.games

import io.github.snems.fathom.engine.board.Ship
import io.github.snems.fathom.game.Player
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShotResult
import kotlinx.serialization.Serializable

/**
 * A shot with what is known about how it was chosen.
 */
@Serializable
internal data class ShotRecord(
    val player: Player,
    val x: Int,
    val y: Int,
    val result: ShotResult,
    val sunk: Ship?,
    /**
     * Weight the shooter gave every cell before the shot, row by row. Null when it weighed nothing.
     */
    val weights: List<Double>?,
    /**
     * Milliseconds the shooter took to choose. Null in a game read from a log.
     */
    val millis: Double?,
    /**
     * Time of day of the shot in a game read from a log, otherwise null.
     */
    val at: String?,
) {
    fun position() = Position(x, y)
}
