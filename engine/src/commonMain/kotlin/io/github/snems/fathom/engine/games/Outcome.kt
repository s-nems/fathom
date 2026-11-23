package io.github.snems.fathom.engine.games

import io.github.snems.fathom.game.GameResult.Ending
import io.github.snems.fathom.game.Player
import kotlinx.serialization.Serializable

/**
 * How a game ended. The ending is null when it comes from a log that does not tell.
 */
@Serializable
internal data class Outcome(
    val winner: Player,
    val ending: Ending?,
    val shots: Map<Player, Int>,
)
