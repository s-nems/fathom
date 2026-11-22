package io.github.snems.fathom.arena

import io.github.snems.fathom.arena.layouts.LayoutSource
import io.github.snems.fathom.arena.layouts.SEED_STRIDE
import io.github.snems.fathom.arena.shooters.Shooter
import io.github.snems.fathom.arena.shooters.ShooterFactory
import io.github.snems.fathom.game.Fleet
import io.github.snems.fathom.game.FleetUnderFire
import jd.mg.ships.tournament.api.ShipPlacement
import jd.mg.ships.tournament.api.Shot
import kotlin.random.Random

/**
 * Fixed fleets for shooters to sink, one after another. Every shooter meets the same fleets. The fleets are the
 * games of a run from [firstGame] on, and a game is the same whichever part of the run it is played in.
 */
class ShootingRange(
    private val fleets: List<Fleet>,
    private val seed: Long,
    private val firstGame: Int = 0,
) {
    constructor(layouts: LayoutSource, games: Int, seed: Long, firstGame: Int = 0) : this(
        List(games) { game -> fleetOf(layouts.layout(randomFor(seed, firstGame + game, LAYOUT_STREAM))) },
        seed,
        firstGame,
    )

    /**
     * Shots a fresh shooter needs to sink each fleet, in the order of the fleets.
     */
    fun shotsToSink(shooter: ShooterFactory): IntArray = shotsFired(shooter).map { it.size }.toIntArray()

    /**
     * The shots a fresh shooter fires until each fleet is sunk, in the order of the fleets.
     */
    fun shotsFired(shooter: ShooterFactory): List<List<Shot>> =
        inParallel(fleets.size) { game ->
            sink(fleets[game], shooter(randomFor(seed, firstGame + game, SHOOTER_STREAM)))
        }

    private fun sink(
        fleet: Fleet,
        shooter: Shooter,
    ): List<Shot> {
        val target = FleetUnderFire(fleet)
        val shots = mutableListOf<Shot>()
        while (!target.isSunk) {
            val shot = target.receive(shooter.chooseShot(target.unshot()))
            shooter.onShotResult(shot)
            shots += shot
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
