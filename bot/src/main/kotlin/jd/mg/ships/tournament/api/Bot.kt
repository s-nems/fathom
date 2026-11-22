package jd.mg.ships.tournament.api

/**
 * Contract for a bot loaded by the local tournament.
 *
 * The tournament creates a new instance for every game. A bot must have a public no-argument constructor.
 */
interface Bot {
    fun placeShip(ownFleet: List<ShipPlacement>, remainingShipSizes: List<Int>): ShipPlacement

    fun chooseShot(availablePositions: List<Position>): Position

    fun onShotResult(shot: Shot) = Unit
}

data class Position(
    val x: Int,
    val y: Int,
)

enum class Direction {
    HORIZONTAL,
    VERTICAL,
}

data class ShipPlacement(
    val size: Int,
    val position: Position,
    val direction: Direction,
)

enum class ShotResult {
    MISS,
    HIT,
    SUNK,
}

data class Shot(
    val position: Position,
    val result: ShotResult,
    val sunkShip: ShipPlacement? = null,
)
