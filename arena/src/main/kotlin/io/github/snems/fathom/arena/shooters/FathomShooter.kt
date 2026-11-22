package io.github.snems.fathom.arena.shooters

import io.github.snems.fathom.bot.FathomBot
import io.github.snems.fathom.bot.reporting.BotEvent
import io.github.snems.fathom.bot.shooting.SamplerSettings
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.Shot
import kotlin.random.Random
import kotlin.time.Duration

/**
 * The shooting half of the bot under test. It has no time budget, so that a table does not depend on how fast
 * the machine is.
 */
class FathomShooter(
    random: Random,
    sampler: SamplerSettings = SamplerSettings(),
) : Shooter {
    private var weights: DoubleArray? = null
    private val bot =
        FathomBot(
            random,
            samplerSettings = sampler,
            timeBudget = Duration.INFINITE,
            observer = { event ->
                when (event) {
                    is BotEvent.ShotChosen -> weights = event.weights
                    is BotEvent.Failed -> throw event.failure
                    else -> Unit
                }
            },
        )

    override fun chooseShot(availablePositions: List<Position>): Position {
        weights = null
        return bot.chooseShot(availablePositions)
    }

    override fun onShotResult(shot: Shot) = bot.onShotResult(shot)

    override fun weightsOfLastShot(): DoubleArray? = weights
}
