package io.github.snems.fathom.engine.games

import io.github.snems.fathom.game.Player
import kotlinx.serialization.Serializable

/**
 * A game to play between two sides. The same request plays the same game.
 */
@Serializable
internal data class GameRequest(
    val one: Contestant,
    val two: Contestant,
    val seed: Long,
    /**
     * Null to draw the first shooter from the seed.
     */
    val firstShooter: Player? = null,
)
