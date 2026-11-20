package io.github.snems.fathom.bot

import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import jd.mg.ships.tournament.api.Bot
import jd.mg.ships.tournament.api.Direction
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement
import jd.mg.ships.tournament.api.Shot
import kotlin.random.Random
import kotlin.time.TimeSource

/**
 * The tournament bot. It lays its long ships along the edges, leaving as much open water as it can, and shoots
 * at the cell that is occupied most often in random fleets that agree with every shot so far. It keeps no state
 * between games and starts no threads.
 *
 * An exception would forfeit the game. So when the referee passes something no rule allows, such as an empty
 * list, the bot answers with a last resort instead of throwing.
 */
class FathomBot internal constructor(
    random: Random,
    layoutPolicy: LayoutPolicy = LayoutPolicy(),
    samplerSettings: SamplerSettings = SamplerSettings(),
    timeSource: TimeSource = TimeSource.Monotonic,
) : Bot {
    constructor() : this(Random.Default)

    /** A bot that draws its random choices from the given source, so a game can be repeated. */
    constructor(random: Random) : this(random, LayoutPolicy())

    private val planner = FleetPlanner(LayoutDrafts(random, layoutPolicy))
    private val waters = EnemyWaters()
    private val picker =
        ShotPicker(random, listOf(FleetSampler(waters, random, samplerSettings, timeSource), PlacementDensity(waters)))

    /** Shots the referee did not answer, so it must have refused them. */
    private val refused = mutableSetOf<Position>()
    private var unanswered: Position? = null

    override fun placeShip(
        ownFleet: List<ShipPlacement>,
        remainingShipSizes: List<Int>,
    ): ShipPlacement =
        try {
            planner.nextShip(ownFleet, remainingShipSizes)
        } catch (expected: Exception) {
            ShipPlacement(remainingShipSizes.firstOrNull() ?: FLEET_SHIP_SIZES.last(), TOP_LEFT, Direction.HORIZONTAL)
        }

    override fun chooseShot(availablePositions: List<Position>): Position {
        unanswered?.let { refused += it }
        val shot =
            try {
                picker.pick(availablePositions.filter { it !in refused }.ifEmpty { availablePositions })
            } catch (expected: Exception) {
                availablePositions.firstOrNull() ?: TOP_LEFT
            }
        unanswered = shot
        return shot
    }

    override fun onShotResult(shot: Shot) {
        unanswered = null
        waters.record(shot)
    }

    private companion object {
        val TOP_LEFT = Position(0, 0)
    }
}
