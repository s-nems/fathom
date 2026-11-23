package io.github.snems.fathom.engine.catalogue

import io.github.snems.fathom.arena.shooters.Shooter
import io.github.snems.fathom.arena.shooters.ShooterKind
import kotlin.random.Random

/**
 * The shooters of the catalogue. Each is built once for a layout source and then kept in [built], because the
 * informed one studies thousands of layouts first. Whoever calls it from several threads passes a map that
 * allows that.
 */
internal class ShooterFactories(
    private val built: MutableMap<ShooterOrder, (Random) -> Shooter> = HashMap(),
) {
    /**
     * Makes the shooter of that name for fleets of the layout source [against]. The informed one studies layouts
     * drawn from [studySeed].
     *
     * @throws IllegalArgumentException if the catalogue has no such shooter or layout source
     */
    fun of(
        shooter: String,
        against: String,
        studySeed: Long = STUDY_SEED,
    ): (Random) -> Shooter {
        val kind = ShooterKind.labelled(shooter)
        val source = layoutSource(against)
        return built.getOrPut(ShooterOrder(shooter, against, studySeed)) { kind.against(source, studySeed) }
    }

    private companion object {
        /**
         * Seed of the layouts the informed shooter studies unless a run names its own.
         */
        const val STUDY_SEED = 1L
    }
}
