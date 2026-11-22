package io.github.snems.fathom.bot

import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.github.snems.fathom.bot.placing.FleetPlanner
import io.github.snems.fathom.bot.placing.LayoutDrafts
import io.github.snems.fathom.bot.placing.LayoutPolicy
import io.github.snems.fathom.bot.reporting.BotEvent.Failed
import io.github.snems.fathom.bot.reporting.BotEvent.LastResortShip
import io.github.snems.fathom.bot.reporting.BotEvent.LastResortShot
import io.github.snems.fathom.bot.reporting.BotEvent.ShipPlaced
import io.github.snems.fathom.bot.reporting.BotEvent.ShipRefused
import io.github.snems.fathom.bot.reporting.BotEvent.ShotChosen
import io.github.snems.fathom.bot.reporting.BotEvent.ShotRefused
import io.github.snems.fathom.bot.reporting.BotLog
import io.github.snems.fathom.bot.reporting.BotObserver
import io.github.snems.fathom.bot.shooting.EnemyWaters
import io.github.snems.fathom.bot.shooting.FleetSampler
import io.github.snems.fathom.bot.shooting.PlacementDensity
import io.github.snems.fathom.bot.shooting.SamplerSettings
import io.github.snems.fathom.bot.shooting.ShotPicker
import io.github.snems.fathom.bot.shooting.ShotWeights
import jd.mg.ships.tournament.api.Bot
import jd.mg.ships.tournament.api.Direction
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement
import jd.mg.ships.tournament.api.Shot
import kotlin.random.Random
import kotlin.time.Duration
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.TimeSource

/**
 * The tournament bot. It lays its long ships along the edges, leaving as much open water as it can, and shoots
 * at the cell that is occupied most often in random fleets that agree with every shot so far. It keeps no state
 * between games and starts no threads.
 *
 * A call that throws counts as an illegal move. So when the referee passes something no rule allows, such as an
 * empty list, or the bot's own code fails, the bot answers with a last resort. The [BotObserver] is told of
 * every answer, refusal, last resort and failure. Unless one is given, the warnings and errors go to the system
 * logger and the moves are not logged, so that a tournament is not flooded.
 */
class FathomBot(
    random: Random,
    layoutPolicy: LayoutPolicy = LayoutPolicy(),
    samplerSettings: SamplerSettings = SamplerSettings(),
    timeBudget: Duration = TIME_BUDGET,
    timeSource: TimeSource = TimeSource.Monotonic,
    private val observer: BotObserver = BotLog(System.getLogger(LOGGER_NAME), everyMove = false),
) : Bot {
    constructor() : this(Random.Default)

    private val budget = TimeBudget(timeBudget, timeSource)
    private val planner = FleetPlanner(LayoutDrafts(random, layoutPolicy), budget)
    private val waters = EnemyWaters()
    private val picker =
        ShotPicker(random, listOf(FleetSampler(waters, random, samplerSettings, budget), PlacementDensity(waters)))

    /**
     * Shots the referee offered again after the bot fired them, so it must have refused them.
     */
    private val refusedShots = mutableSetOf<Position>()
    private var lastShot: Position? = null
    private var lastShip: ShipPlacement? = null

    override fun placeShip(
        ownFleet: List<ShipPlacement>,
        remainingShipSizes: List<Int>,
    ): ShipPlacement {
        val answered = lastShip
        if (answered != null && answered !in ownFleet) observer.on(ShipRefused(answered))
        val planned = attempt { planner.nextShip(ownFleet, remainingShipSizes) }
        val ship = planned ?: lastResort(remainingShipSizes.firstOrNull() ?: FLEET_SHIP_SIZES.last())
        observer.on(if (planned == null) LastResortShip(ship) else ShipPlaced(ship))
        lastShip = ship
        return ship
    }

    override fun chooseShot(availablePositions: List<Position>): Position {
        val answered = lastShot
        if (answered != null && answered in availablePositions) {
            refusedShots += answered
            observer.on(ShotRefused(answered))
        }
        val offered = availablePositions.filter { it !in refusedShots }.ifEmpty { availablePositions }
        val pick = attempt { picker.pick(offered) }
        val shot = pick?.shot ?: availablePositions.firstOrNull() ?: TOP_LEFT
        observer.on(if (pick == null) LastResortShot(shot) else ShotChosen(shot, nameOf(pick.source), pick.weights))
        lastShot = shot
        return shot
    }

    override fun onShotResult(shot: Shot) {
        attempt { waters.record(shot) }
    }

    /**
     * What the block finds, or null when it finds nothing or fails. A failure goes to the observer.
     */
    private inline fun <T : Any> attempt(block: () -> T?): T? =
        try {
            block()
        } catch (failure: Exception) {
            observer.on(Failed(failure))
            null
        }

    private fun lastResort(size: Int) = ShipPlacement(size, TOP_LEFT, Direction.HORIZONTAL)

    private fun nameOf(source: ShotWeights?): String = source?.let { it::class.simpleName } ?: NO_SOURCE

    private companion object {
        const val LOGGER_NAME = "fathom"
        const val NO_SOURCE = "random"
        val TOP_LEFT = Position(0, 0)

        /**
         * Drafting a layout or sampling fleets for one answer stops after this long. The referee allows 500 ms.
         */
        val TIME_BUDGET = 100.milliseconds
    }
}
