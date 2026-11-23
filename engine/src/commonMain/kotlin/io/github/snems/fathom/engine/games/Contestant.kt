package io.github.snems.fathom.engine.games

import kotlinx.serialization.Serializable

/**
 * One side of a game: a layout source that places its fleet and a shooter, both by their names in the catalogue.
 */
@Serializable
internal data class Contestant(
    val layout: String,
    val shooter: String,
) {
    /**
     * What the side is called next to its game.
     */
    val name: String get() = "$layout / $shooter"
}
