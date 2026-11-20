package io.github.snems.fathom.arena

import io.github.snems.fathom.game.Fleet
import io.github.snems.fathom.game.FleetUnderFire
import java.util.stream.IntStream
import kotlin.random.Random

/**
 * Fixed fleets for shooters to sink, one after another. Every shooter meets the same fleets, so two shooters
 * can be compared fleet by fleet.
 */
class ShootingRange(
    layouts: LayoutSource,
    private val games: Int,
    private val seed: Long,
) {
    private val fleets: List<Fleet> =
        (0 until games).map { game -> layouts.layout(randomFor(game, LAYOUT_STREAM)).fold(Fleet.EMPTY, Fleet::place) }

    /** Shots a fresh shooter needs to sink each fleet, in the order of the fleets. */
    fun shotsToSink(shooter: (Random) -> Shooter): IntArray =
        IntStream
            .range(0, games)
            .parallel()
            .map { game -> shotsToSink(shooter(randomFor(game, SHOOTER_STREAM)), fleets[game]) }
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

    private fun randomFor(
        game: Int,
        stream: Long,
    ) = Random((seed * STREAMS + stream) * GAME_STRIDE + game)

    private companion object {
        const val LAYOUT_STREAM = 0L
        const val SHOOTER_STREAM = 1L
        const val STREAMS = 2L
        const val GAME_STRIDE = 1_000_003L
    }
}
