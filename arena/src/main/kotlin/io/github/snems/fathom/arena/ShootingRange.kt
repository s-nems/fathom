package io.github.snems.fathom.arena

import io.github.snems.fathom.game.Fleet
import io.github.snems.fathom.game.FleetUnderFire
import jd.mg.ships.tournament.api.ShipPlacement
import java.util.stream.IntStream
import kotlin.random.Random

/** Fixed fleets for shooters to sink, one after another. Every shooter meets the same fleets. */
class ShootingRange(
    private val fleets: List<Fleet>,
    private val seed: Long,
) {
    /** A range of [games] fleets drawn from [layouts]. */
    constructor(layouts: LayoutSource, games: Int, seed: Long) : this(
        (0 until games).map { game -> fleetOf(layouts.layout(randomFor(seed, game, LAYOUT_STREAM))) },
        seed,
    )

    /** Shots a fresh shooter needs to sink each fleet, in the order of the fleets. */
    fun shotsToSink(shooter: (Random) -> Shooter): IntArray =
        IntStream
            .range(0, fleets.size)
            .parallel()
            .map { game -> shotsToSink(shooter(randomFor(seed, game, SHOOTER_STREAM)), fleets[game]) }
            .toArray()

    private fun shotsToSink(
        shooter: Shooter,
        fleet: Fleet,
    ): Int {
        val target = FleetUnderFire(fleet)
        var shots = 0
        while (!target.isSunk) {
            shooter.onShotResult(target.receive(shooter.chooseShot(target.unshot())))
            shots++
        }
        return shots
    }

    companion object {
        private const val LAYOUT_STREAM = 0L
        private const val SHOOTER_STREAM = 1L
        private const val STREAMS = 2L

        fun fleetOf(ships: List<ShipPlacement>): Fleet = ships.fold(Fleet.EMPTY, Fleet::place)

        private fun randomFor(
            seed: Long,
            game: Int,
            stream: Long,
        ) = Random((seed * STREAMS + stream) * SEED_STRIDE + game)
    }
}
