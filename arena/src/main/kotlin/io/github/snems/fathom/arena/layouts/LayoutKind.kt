package io.github.snems.fathom.arena.layouts

import io.github.snems.fathom.arena.labelOf
import io.github.snems.fathom.bot.FathomBot
import io.github.snems.fathom.bot.placing.LayoutPolicy
import io.github.snems.fathom.bot.reporting.BotEvent
import kotlin.random.Random
import kotlin.time.Duration

/**
 * The layout sources the arena measures, in the order of the shot table.
 */
enum class LayoutKind(
    val source: LayoutSource,
) {
    /**
     * Fleets placed ship by ship at random, the way a simple opponent places them.
     */
    SEQUENTIAL(SequentialLayouts(shuffled = false)),
    SHUFFLED(SequentialLayouts(shuffled = true)),
    FATHOM(BotLayouts { untimedBot(it) }),
    FATHOM_NO_EDGE(BotLayouts { untimedBot(it, LayoutPolicy(edgeChance = 0.0)) }),
    FATHOM_FIRST_DRAFT(BotLayouts { untimedBot(it, LayoutPolicy(drafts = 1)) }),
    ;

    val label: String = labelOf(this)

    companion object {
        /**
         * @throws IllegalArgumentException if no layout source has that label
         */
        fun labelled(label: String): LayoutKind =
            requireNotNull(entries.firstOrNull { it.label == label }) { "Unknown layout source: $label" }
    }
}

/**
 * The bot without a time budget, so that a table does not depend on how fast the machine is.
 */
private fun untimedBot(
    random: Random,
    layout: LayoutPolicy = LayoutPolicy(),
) = FathomBot(random, layout, timeBudget = Duration.INFINITE, observer = {
    if (it is BotEvent.Failed) throw it.failure
})
