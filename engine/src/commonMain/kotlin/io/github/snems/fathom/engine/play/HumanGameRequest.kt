package io.github.snems.fathom.engine.play

import io.github.snems.fathom.engine.board.Ship
import io.github.snems.fathom.engine.board.Target
import io.github.snems.fathom.engine.games.Contestant
import io.github.snems.fathom.game.Player
import kotlinx.serialization.Serializable

/**
 * A game of a human as player one against a side from the catalogue, with every shot the human has fired so
 * far. The engine keeps nothing between calls: the same request gives the same game, so the page asks again
 * with one more shot.
 */
@Serializable
internal data class HumanGameRequest(
    val fleet: List<Ship>,
    val opponent: Contestant,
    val seed: Long,
    /**
     * Null to draw the first shooter from the seed.
     */
    val firstShooter: Player? = null,
    val shots: List<Target> = emptyList(),
)
