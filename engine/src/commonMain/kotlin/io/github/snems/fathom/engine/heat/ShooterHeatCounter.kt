package io.github.snems.fathom.engine.heat

import io.github.snems.fathom.arena.ShootingRange
import io.github.snems.fathom.engine.board.CELLS
import io.github.snems.fathom.engine.board.cell
import io.github.snems.fathom.engine.catalogue.ShooterFactories
import io.github.snems.fathom.engine.catalogue.layoutSource
import io.github.snems.fathom.engine.measure.RunPart

/**
 * Counts, shot number by shot number, the cells a shooter shoots at.
 */
internal class ShooterHeatCounter(
    private val factories: ShooterFactories,
) {
    /**
     * Counts the games of a run from [firstGame] on, so that parts of a run can be counted apart and added up.
     *
     * @throws IllegalArgumentException if there is no such shooter or source, or the games are out of range
     */
    fun count(
        shooter: String,
        layout: String,
        games: Int,
        seed: Long,
        firstGame: Int = 0,
    ): ShooterHeat {
        RunPart.check(firstGame, games, allowed = GAMES)
        val range = ShootingRange(layoutSource(layout), games, seed, firstGame)
        val turns = List(CELLS) { IntArray(CELLS) }
        for (volley in range.shotsFired(factories.of(shooter, against = layout))) {
            volley.forEachIndexed { turn, shot -> turns[turn][shot.position.cell()]++ }
        }
        return ShooterHeat(shooter, layout, games, turns.map(IntArray::asList))
    }

    companion object {
        val GAMES = 1..2_000
    }
}
