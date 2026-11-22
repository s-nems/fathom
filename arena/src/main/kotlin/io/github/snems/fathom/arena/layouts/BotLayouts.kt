package io.github.snems.fathom.arena.layouts

import io.github.snems.fathom.game.Fleet
import jd.mg.ships.tournament.api.Bot
import jd.mg.ships.tournament.api.ShipPlacement
import kotlin.random.Random

/**
 * The fleets a bot places when it is asked ship by ship, as a tournament asks it.
 */
class BotLayouts(
    private val bot: (Random) -> Bot,
) : LayoutSource {
    override fun layout(random: Random): List<ShipPlacement> {
        val placer = bot(random)
        var fleet = Fleet.EMPTY
        while (!fleet.isComplete) {
            fleet = fleet.place(placer.placeShip(fleet.ships, fleet.remainingSizes))
        }
        return fleet.ships
    }
}
