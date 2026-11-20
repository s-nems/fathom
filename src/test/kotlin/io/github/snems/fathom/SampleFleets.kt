package io.github.snems.fathom

import jd.mg.ships.tournament.api.Direction
import jd.mg.ships.tournament.api.Direction.HORIZONTAL
import jd.mg.ships.tournament.api.Direction.VERTICAL
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement

/** Ships and fleets shared by the tests. */
object SampleFleets {
    /** A complete legal fleet, largest ship first. */
    val COMPLETE: List<ShipPlacement> =
        listOf(
            ship(5, 0, 0, HORIZONTAL),
            ship(4, 9, 0, VERTICAL),
            ship(4, 0, 2, HORIZONTAL),
            ship(3, 6, 1, VERTICAL),
            ship(3, 0, 4, HORIZONTAL),
            ship(3, 5, 5, HORIZONTAL),
            ship(2, 0, 6, HORIZONTAL),
            ship(2, 9, 5, VERTICAL),
            ship(2, 3, 7, HORIZONTAL),
            ship(2, 7, 9, HORIZONTAL),
        )

    /** [COMPLETE] mirrored along the diagonal: another complete legal fleet, largest ship first. */
    val TRANSPOSED: List<ShipPlacement> =
        listOf(
            ship(5, 0, 0, VERTICAL),
            ship(4, 0, 9, HORIZONTAL),
            ship(4, 2, 0, VERTICAL),
            ship(3, 1, 6, HORIZONTAL),
            ship(3, 4, 0, VERTICAL),
            ship(3, 5, 5, VERTICAL),
            ship(2, 6, 0, VERTICAL),
            ship(2, 5, 9, HORIZONTAL),
            ship(2, 7, 3, VERTICAL),
            ship(2, 9, 7, VERTICAL),
        )

    fun ship(
        size: Int,
        x: Int,
        y: Int,
        direction: Direction,
    ) = ShipPlacement(size, Position(x, y), direction)
}
