package io.github.snems.fathom.engine.play

import io.github.snems.fathom.arena.ShootingRange
import io.github.snems.fathom.arena.layouts.LayoutKind
import io.github.snems.fathom.engine.board.Ship
import io.github.snems.fathom.engine.games.GameRecord
import io.github.snems.fathom.game.Fleet
import io.github.snems.fathom.game.Player

/**
 * What every game of a human has in common, whoever runs it: which player the human is, the fleet the human
 * may bring, and what the human may see of the opponent while the game is on.
 */
internal object HumanSide {
    val PLAYER = Player.ONE
    const val NAME = "you"

    /**
     * What an opponent that studies layouts expects of a human, whose fleet comes from no source.
     */
    val ASSUMED_LAYOUT = LayoutKind.SEQUENTIAL.label

    fun names(opponent: String): Map<Player, String> = mapOf(PLAYER to NAME, PLAYER.opponent to opponent)

    /**
     * @throws IllegalArgumentException if the ships are not a whole legal fleet
     */
    fun fleetOf(ships: List<Ship>): Fleet {
        val fleet = ShootingRange.fleetOf(ships.map(Ship::placement))
        require(fleet.isComplete) { "The fleet still needs ships of sizes ${fleet.remainingSizes}" }
        return fleet
    }

    /**
     * The record of a game that is still on, as the human may see it: of the opponent only its sunk ships and
     * none of its weights.
     */
    fun whileOn(record: GameRecord): GameRecord {
        val sunk = record.shots.filter { it.player == PLAYER }.mapNotNull { it.sunk }
        return record.copy(
            fleets = record.fleets + (PLAYER.opponent to sunk),
            shots = record.shots.map { if (it.player == PLAYER) it else it.copy(weights = null) },
        )
    }
}
