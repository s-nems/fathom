package io.github.snems.fathom.bot

import io.github.snems.fathom.board.Board
import io.kotest.matchers.collections.shouldBeIn
import io.kotest.matchers.collections.shouldHaveSize
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement
import jd.mg.ships.tournament.api.Shot
import jd.mg.ships.tournament.api.ShotResult
import jd.mg.ships.tournament.api.ShotResult.HIT
import jd.mg.ships.tournament.api.ShotResult.MISS
import org.junit.jupiter.api.Test
import kotlin.random.Random

class ShootingTest {
    private val bot = FathomBot(Random(SEED))
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
    fun shouldAnswerDifferentlyEachTimeAShotIsRefused() {
        // when
        val shots = List(ATTEMPTS) { bot.chooseShot(unshot) }

        // then
        shots.distinct() shouldHaveSize ATTEMPTS
    }

    /** Tells the bot the result of a shot at the cell, as the referee would. */
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
        const val ATTEMPTS = 3
    }
}
