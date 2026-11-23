package io.github.snems.fathom.engine.games

import io.github.snems.fathom.arena.shooters.Shooter
import io.github.snems.fathom.engine.catalogue.ShooterFactories
import io.github.snems.fathom.engine.catalogue.layoutSource
import io.github.snems.fathom.game.Player
import jd.mg.ships.tournament.api.ShipPlacement
import kotlin.random.Random
import kotlin.time.TimeSource

/**
 * Seats the sides of a game. Every side times its choices on the same [timeSource].
 */
internal class Sides(
    private val factories: ShooterFactories,
    private val timeSource: TimeSource,
) {
    /**
     * A side from the catalogue. Its shooter is built for fleets of the layout source [against].
     *
     * @throws IllegalArgumentException if the catalogue lacks the layout source or the shooter
     */
    fun of(
        contestant: Contestant,
        against: String,
        random: Random,
    ): Side {
        val shooter = factories.of(contestant.shooter, against)
        val fleet = layoutSource(contestant.layout).layout(Random(random.nextLong()))
        return of(fleet, shooter(Random(random.nextLong())))
    }

    /**
     * A side with a fleet and a shooter from outside the catalogue.
     */
    fun of(
        fleet: List<ShipPlacement>,
        shooter: Shooter,
    ) = Side(fleet, shooter, timeSource)
}

/**
 * The player that shoots first: the one [asked] for, otherwise one drawn. It always draws, so that the rest of
 * a game does not depend on who was asked for.
 */
internal fun firstShooter(
    asked: Player?,
    random: Random,
): Player = Player.entries.random(random).let { drawn -> asked ?: drawn }
