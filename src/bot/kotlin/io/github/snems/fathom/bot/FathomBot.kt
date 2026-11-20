package io.github.snems.fathom.bot

import io.github.snems.fathom.board.Board
import io.github.snems.fathom.board.cells
import io.github.snems.fathom.board.claimedCells
import jd.mg.ships.tournament.api.Bot
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement
import kotlin.random.Random

/** The tournament bot. For now it places ships and shoots at random among the legal moves. */
class FathomBot(
    private val random: Random,
) : Bot {
    constructor() : this(Random.Default)

    override fun placeShip(
        ownFleet: List<ShipPlacement>,
        remainingShipSizes: List<Int>,
    ): ShipPlacement {
        val claimed = ownFleet.claimedCells()
        val onBoard = Board.placementsOf(remainingShipSizes.first())
        val fitting = onBoard.filter { ship -> ship.cells().none { it in claimed } }
        return fitting.ifEmpty { onBoard }.random(random)
    }

    override fun chooseShot(availablePositions: List<Position>): Position = availablePositions.random(random)
}
