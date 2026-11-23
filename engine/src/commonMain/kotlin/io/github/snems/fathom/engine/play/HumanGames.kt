package io.github.snems.fathom.engine.play

import io.github.snems.fathom.board.Board
import io.github.snems.fathom.engine.board.Target
import io.github.snems.fathom.engine.games.Recording
import io.github.snems.fathom.engine.games.Sides
import io.github.snems.fathom.engine.games.firstShooter
import jd.mg.ships.tournament.api.Position
import kotlin.random.Random

/**
 * Plays the game of a human up to the next shot the human owes. It plays the game again from its start on
 * every call, which needs no thread and no memory, and the seed makes the opponent answer the same each time.
 */
internal class HumanGames(
    private val sides: Sides,
) {
    /**
     * @throws IllegalArgumentException if the fleet is not a whole legal fleet, the catalogue lacks the opponent,
     * or the shots cannot be the shots of one game
     */
    fun play(request: HumanGameRequest): HumanGame {
        val fleet = HumanSide.fleetOf(request.fleet)
        val human = ScriptedHuman(legal(request.shots))
        val random = Random(request.seed)
        val first = firstShooter(request.firstShooter, random)
        val opponent = sides.of(request.opponent, against = HumanSide.ASSUMED_LAYOUT, random)
        val recording =
            Recording(
                names = HumanSide.names(request.opponent.name),
                sides = mapOf(HumanSide.PLAYER to sides.of(fleet.ships, human), HumanSide.PLAYER.opponent to opponent),
            )
        recording.play(first)
        require(!human.hasShotsLeft) { "The game was over before the last of the shots" }
        val record = recording.record()
        return HumanGame(
            // The forfeit that stopped the game for the human is no result.
            game = if (human.isWaiting) HumanSide.whileOn(record).copy(result = null) else record,
            yourTurn = human.isWaiting,
            over = !human.isWaiting,
        )
    }

    private fun legal(shots: List<Target>): List<Position> {
        val positions = shots.map(Target::position)
        positions.forEach { require(it in Board) { "No such cell: $it" } }
        require(positions.distinct().size == positions.size) { "You have shot at that cell already" }
        return positions
    }
}
