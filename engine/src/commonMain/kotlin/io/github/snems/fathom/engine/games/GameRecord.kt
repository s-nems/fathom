package io.github.snems.fathom.engine.games

import io.github.snems.fathom.engine.board.Ship
import io.github.snems.fathom.game.Player
import kotlinx.serialization.Serializable

/**
 * A game, whole or still being played, in the order it happened.
 */
@Serializable
internal data class GameRecord(
    val title: String,
    val players: Map<Player, String>,
    val fleets: Map<Player, List<Ship>>,
    val shots: List<ShotRecord>,
    val result: Outcome?,
)
