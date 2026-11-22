package io.github.snems.fathom.bot

import io.github.snems.fathom.bot.placing.LayoutPolicy
import io.github.snems.fathom.bot.reporting.BotEvent
import io.github.snems.fathom.bot.shooting.SamplerSettings
import kotlin.random.Random
import kotlin.time.Duration

/**
 * The bot without a time budget, so that what it answers depends on the seed alone and not on the clock. A
 * failure inside it fails the test instead of hiding behind a last resort.
 */
internal fun untimedBot(
    random: Random,
    layoutPolicy: LayoutPolicy = LayoutPolicy(),
    samplerSettings: SamplerSettings = SamplerSettings(),
) = FathomBot(random, layoutPolicy, samplerSettings, timeBudget = Duration.INFINITE, observer = {
    if (it is BotEvent.Failed) throw it.failure
})
