package io.github.snems.fathom.arena.shooters

import io.github.snems.fathom.arena.labelOf
import io.github.snems.fathom.arena.layouts.LayoutSource
import io.github.snems.fathom.arena.layouts.PlacementFrequencies
import io.github.snems.fathom.bot.shooting.SamplerSettings

private const val FREQUENCY_LAYOUTS = 10_000

/**
 * The shooters the arena measures, in the order of the shot table.
 */
enum class ShooterKind(
    private val shooterAgainst: (LayoutSource, Long) -> ShooterFactory,
) {
    RANDOM(always(::RandomShooter)),
    HUNT_TARGET(always { HuntTargetShooter(it, parity = false) }),
    HUNT_TARGET_PARITY(always { HuntTargetShooter(it, parity = true) }),
    DENSITY(always(::DensityShooter)),

    /**
     * A density shooter that has seen many layouts of the source it shoots at.
     */
    DENSITY_INFORMED(::informedDensityShooter),
    FATHOM(always(::FathomShooter)),
    FATHOM_SEQUENTIAL(always { FathomShooter(it, SamplerSettings(sequentialChance = 1.0)) }),
    FATHOM_ANY_FLEET(always { FathomShooter(it, SamplerSettings(sequentialChance = 0.0)) }),
    FATHOM_NO_SAMPLING(always { FathomShooter(it, SamplerSettings(samples = 0)) }),
    ;

    val label: String = labelOf(this)

    /**
     * The shooter for fleets of that layout source. Only the informed one looks at the source and the seed.
     */
    fun against(
        layouts: LayoutSource,
        seed: Long,
    ): ShooterFactory = shooterAgainst(layouts, seed)

    companion object {
        /**
         * @throws IllegalArgumentException if no shooter has that label
         */
        fun labelled(label: String): ShooterKind =
            requireNotNull(entries.firstOrNull { it.label == label }) { "Unknown shooter: $label" }
    }
}

/**
 * A shooter that is the same whatever fleets it is to meet.
 */
private fun always(shooter: ShooterFactory): (LayoutSource, Long) -> ShooterFactory = { _, _ -> shooter }

private fun informedDensityShooter(
    layouts: LayoutSource,
    seed: Long,
): ShooterFactory {
    val frequencies = PlacementFrequencies(layouts, FREQUENCY_LAYOUTS, seed)
    return { random -> DensityShooter(random, frequencies::weightOf) }
}
