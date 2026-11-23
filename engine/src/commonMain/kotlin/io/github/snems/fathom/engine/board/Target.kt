package io.github.snems.fathom.engine.board

import jd.mg.ships.tournament.api.Position
import kotlinx.serialization.Serializable

/**
 * A cell as JSON, the way the browser names the cell a human shoots at.
 */
@Serializable
internal data class Target(
    val x: Int,
    val y: Int,
) {
    fun position() = Position(x, y)
}
