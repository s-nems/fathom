package io.github.snems.fathom.engine.catalogue

import io.github.snems.fathom.arena.layouts.LayoutKind
import io.github.snems.fathom.arena.shooters.ShooterKind
import io.github.snems.fathom.board.Board
import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import kotlinx.serialization.Serializable

/**
 * What the arena offers to choose from, and the size of the game.
 */
@Serializable
internal data class CatalogueView(
    val layouts: List<String>,
    val shooters: List<String>,
    val boardSize: Int,
    val fleet: List<Int>,
    val limits: Limits,
) {
    companion object {
        fun ofTheArena() =
            CatalogueView(
                layouts = LayoutKind.entries.map { it.label },
                shooters = ShooterKind.entries.map { it.label },
                boardSize = Board.SIZE,
                fleet = FLEET_SHIP_SIZES,
                limits = Limits.ofTheEngine(),
            )
    }
}
