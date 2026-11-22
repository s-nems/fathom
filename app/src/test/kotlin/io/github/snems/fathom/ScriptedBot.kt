package io.github.snems.fathom

import io.github.snems.fathom.SampleFleets.COMPLETE
import io.github.snems.fathom.board.Board
import jd.mg.ships.tournament.api.Bot
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement
import jd.mg.ships.tournament.api.Shot

/** A bot that answers from a script and records what the referee told it. */
class ScriptedBot(
    placements: List<ShipPlacement> = COMPLETE,
    shots: List<Position> = Board.positions,
    private val beforeMove: () -> Unit = { },
    private val onResult: () -> Unit = { },
) : Bot {
    private val placements = ArrayDeque(placements)
    private val shots = ArrayDeque(shots)

    /** Arguments of each `placeShip` call: the fleet so far and the sizes still to place. */
    val placementCalls = mutableListOf<Pair<List<ShipPlacement>, List<Int>>>()
    val offeredShots = mutableListOf<List<Position>>()
    val results = mutableListOf<Shot>()

    override fun placeShip(
        ownFleet: List<ShipPlacement>,
        remainingShipSizes: List<Int>,
    ): ShipPlacement {
        placementCalls += ownFleet to remainingShipSizes
        beforeMove()
        return placements.removeFirst()
    }

    override fun chooseShot(availablePositions: List<Position>): Position {
        offeredShots += availablePositions
        beforeMove()
        return shots.removeFirst()
    }

    override fun onShotResult(shot: Shot) {
        results += shot
        onResult()
    }
}
