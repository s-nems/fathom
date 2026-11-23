package io.github.snems.fathom.engine.games

import io.github.snems.fathom.game.Player
import kotlin.random.Random

/**
 * Plays whole games between sides from the catalogue through the referee.
 */
internal class Games(
    private val sides: Sides,
) {
    /**
     * @throws IllegalArgumentException if the request names something the catalogue does not have
     */
    fun play(request: GameRequest): GameRecord {
        val random = Random(request.seed)
        val first = firstShooter(request.firstShooter, random)
        val recording =
            Recording(
                names = mapOf(Player.ONE to request.one.name, Player.TWO to request.two.name),
                sides =
                    mapOf(
                        Player.ONE to sides.of(request.one, against = request.two.layout, random),
                        Player.TWO to sides.of(request.two, against = request.one.layout, random),
                    ),
            )
        recording.play(first)
        return recording.record()
    }
}
