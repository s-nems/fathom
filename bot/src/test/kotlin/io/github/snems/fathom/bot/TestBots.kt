package io.github.snems.fathom.bot

import kotlin.random.Random
import kotlin.time.Duration

/** The bot without a time budget, so that what it answers depends on the seed alone and not on the clock. */
internal fun untimedBot(
    random: Random,
    layoutPolicy: LayoutPolicy = LayoutPolicy(),
    samplerSettings: SamplerSettings = SamplerSettings(),
) = FathomBot(random, layoutPolicy, samplerSettings, timeBudget = Duration.INFINITE)
