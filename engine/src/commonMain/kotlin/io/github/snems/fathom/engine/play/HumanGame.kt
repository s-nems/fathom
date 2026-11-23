package io.github.snems.fathom.engine.play

import io.github.snems.fathom.engine.games.GameRecord
import kotlinx.serialization.Serializable

/**
 * The game of a human as far as the human may see it. While it is on, the record shows of the opponent only
 * its sunk ships and none of its weights. The time a shot took is measured anew whenever the game is played
 * again, so it differs from call to call, unlike everything else in the record.
 */
@Serializable
internal data class HumanGame(
    val game: GameRecord,
    val yourTurn: Boolean,
    val over: Boolean,
)
