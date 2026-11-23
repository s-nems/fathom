package io.github.snems.fathom.engine.measure

import io.github.snems.fathom.arena.ShootingRange

/**
 * The games of a run that one call may measure. A run is cut into such parts so that they can be measured
 * apart, in any order, and added up.
 */
internal object RunPart {
    /**
     * Games one call may play, so that a caller hears back in time to show progress.
     */
    val GAMES = 1..10_000

    /**
     * Games a run may have, over all its parts.
     */
    const val RUN_GAMES = ShootingRange.MOST_GAMES

    /**
     * @throws IllegalArgumentException if the games are not a part of a run
     */
    fun check(
        firstGame: Int,
        games: Int,
        allowed: IntRange = GAMES,
    ) {
        require(games in allowed) { "The number of games of a part has to be in $allowed" }
        require(firstGame >= 0) { "A run has no game before its first" }
        require(firstGame.toLong() + games <= RUN_GAMES) { "A run has at most $RUN_GAMES games" }
    }
}
