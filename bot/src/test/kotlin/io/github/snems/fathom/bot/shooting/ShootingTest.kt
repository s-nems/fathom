package io.github.snems.fathom.bot.shooting

import io.github.snems.fathom.SampleFleets.COMPLETE
import io.github.snems.fathom.board.Board
import io.github.snems.fathom.board.cells
import io.github.snems.fathom.bot.untimedBot
import io.kotest.matchers.collections.shouldBeIn
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement
import jd.mg.ships.tournament.api.Shot
import jd.mg.ships.tournament.api.ShotResult
import jd.mg.ships.tournament.api.ShotResult.HIT
import jd.mg.ships.tournament.api.ShotResult.MISS
import jd.mg.ships.tournament.api.ShotResult.SUNK
import org.junit.jupiter.api.Test
import kotlin.random.Random

class ShootingTest {
    private val bot = untimedBot(Random(SEED))
    private val unshot = Board.positions.toMutableList()

    @Test
    fun shouldShootOnlyAtCellsItIsOffered() {
        // given
        val offered = listOf(Position(0, 0), Position(9, 9), Position(4, 6))

        // when
        val shot = bot.chooseShot(offered)

        // then
        shot shouldBeIn offered
    }

    @Test
    fun shouldFollowTheLineOfTwoHits() {
        // given
        answer(Position(4, 4), HIT)
        answer(Position(5, 4), HIT)

        // when
        val shot = bot.chooseShot(unshot)

        // then
        shot shouldBeIn listOf(Position(3, 4), Position(6, 4))
    }

    @Test
    fun shouldTurnTheOtherWayWhenTheLineEndsInAMiss() {
        // given
        answer(Position(4, 4), HIT)
        answer(Position(5, 4), HIT)
        answer(Position(6, 4), MISS)

        // when
        val shot = bot.chooseShot(unshot)

        // then
        shot shouldBeIn listOf(Position(3, 4))
    }

    @Test
    fun shouldAnswerDifferentlyWhenItsShotIsRefused() {
        // given
        answer(Position(4, 4), HIT)
        answer(Position(5, 4), HIT)
        answer(Position(6, 4), MISS)

        // when: the referee asks again without a result for the first answer
        val first = bot.chooseShot(unshot)
        val second = bot.chooseShot(unshot)

        // then
        first shouldBe Position(3, 4)
        second shouldNotBe first
    }

    @Test
    fun shouldShootWhereAWholeFleetFitsAndNotWhereSingleShipsOverlapMost() {
        repeat(BOTS) { seed ->
            // given: two ships of 2 cells are afloat and only the five cells of a row are left for them
            val bot = untimedBot(Random(seed))
            val row = (0..4).map { x -> Position(x, LAST_ROW) }
            COMPLETE.dropLast(2).forEach { ship ->
                ship.cells().dropLast(1).forEach { bot.onShotResult(Shot(it, HIT)) }
                bot.onShotResult(Shot(ship.cells().last(), SUNK, ship))
            }
            (Board.positions - row.toSet()).forEach { bot.onShotResult(Shot(it, MISS)) }

            // when
            val shot = bot.chooseShot(row)

            // then: the two ships can only lie at both ends of the row, so its middle is empty
            shot shouldNotBe row[2]
        }
    }

    /**
     * Tells the bot the result of a shot at the cell, as the referee would.
     */
    private fun answer(
        position: Position,
        result: ShotResult,
        sunkShip: ShipPlacement? = null,
    ) {
        unshot -= position
        bot.onShotResult(Shot(position, result, sunkShip))
    }

    private companion object {
        const val SEED = 7
        const val BOTS = 50
        const val LAST_ROW = 9
    }
}
