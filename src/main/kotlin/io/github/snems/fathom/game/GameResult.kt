package io.github.snems.fathom.game

import jd.mg.ships.tournament.api.ShipPlacement

/** How a finished game ended. */
data class GameResult(
    val winner: Player,
    val ending: Ending,
    private val shots: Map<Player, Int>,
    private val fleets: Map<Player, List<ShipPlacement>>,
) {
    /** Valid shots the player fired. */
    fun shotsBy(player: Player): Int = shots.getValue(player)

    /** Ships the player had accepted, in the order they were placed. */
    fun fleetOf(player: Player): List<ShipPlacement> = fleets.getValue(player)

    enum class Ending {
        /** The winner sank the last ship of the loser. */
        FLEET_SUNK,

        /** The loser made three illegal moves in a row. */
        ILLEGAL_MOVES,

        /** The loser took longer than the limit over one call. */
        TIME_LIMIT,
    }
}
