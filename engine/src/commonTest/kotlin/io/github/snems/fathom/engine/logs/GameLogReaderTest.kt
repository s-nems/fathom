package io.github.snems.fathom.engine.logs

import io.github.snems.fathom.engine.board.Ship
import io.github.snems.fathom.engine.games.Outcome
import io.github.snems.fathom.game.GameResult.Ending
import io.github.snems.fathom.game.Player
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.shouldBe
import jd.mg.ships.tournament.api.Direction
import jd.mg.ships.tournament.api.ShotResult
import kotlin.test.Test

class GameLogReaderTest {
    @Test
    fun shouldReadTheShipsAndShotsOfBothPlayers() {
        // when
        val game = GameLogReader.read(TITLE, LOG)

        // then
        game.title shouldBe TITLE
        game.fleets.getValue(Player.ONE) shouldBe listOf(Ship(2, 0, 0, Direction.HORIZONTAL))
        game.fleets.getValue(Player.TWO) shouldBe listOf(Ship(2, 5, 5, Direction.VERTICAL))
        game.shots.map { it.player } shouldBe listOf(Player.TWO, Player.ONE, Player.TWO, Player.ONE)
        game.shots.map { it.result } shouldBe listOf(ShotResult.MISS, ShotResult.HIT, ShotResult.HIT, ShotResult.SUNK)
        game.shots.first().at shouldBe "10:00:00.010"
    }

    @Test
    fun shouldFindTheSunkShipInTheFleetOfTheOpponent() {
        // when
        val game = GameLogReader.read(TITLE, LOG)

        // then
        game.shots.last().sunk shouldBe Ship(2, 5, 5, Direction.VERTICAL)
    }

    @Test
    fun shouldReadWhoWonAndThatTheFleetWasSunk() {
        // when
        val result = GameLogReader.read(TITLE, LOG).result

        // then
        result shouldBe Outcome(Player.ONE, Ending.FLEET_SUNK, mapOf(Player.ONE to 2, Player.TWO to 2))
    }

    @Test
    fun shouldLeaveTheEndingOpenWhenTheLoserStillHadShips() {
        // given
        val forfeited = LOG.replace("result=win", "result=loss")

        // when
        val result = GameLogReader.read(TITLE, forfeited).result

        // then
        result shouldBe Outcome(Player.TWO, null, mapOf(Player.ONE to 2, Player.TWO to 2))
    }

    @Test
    fun shouldReadAGameThatIsNotOverYet() {
        // given
        val unfinished = LOG.lines().take(LINES_BEFORE_THE_LAST_SHOT).joinToString("\n")

        // when
        val game = GameLogReader.read(TITLE, unfinished)

        // then
        game.result shouldBe null
        game.shots shouldHaveSize LINES_BEFORE_THE_LAST_SHOT - 1
    }

    @Test
    fun shouldRefuseTextThatIsNotALog() {
        // when, then
        shouldThrow<IllegalArgumentException> { GameLogReader.read(TITLE, "10:00:00.000 shot: nowhere") }
        shouldThrow<IllegalArgumentException> { GameLogReader.read(TITLE, "10:00:00.000 retreat: pos=(1,1)") }
        shouldThrow<IllegalArgumentException> { GameLogReader.read(TITLE, "a diary") }
    }

    private companion object {
        const val TITLE = "a log"
        const val LINES_BEFORE_THE_LAST_SHOT = 4
        val LOG =
            """
            10:00:00.000 place-ship: size=2 pos=(0,0) dir=horizontal
            10:00:00.010 enemy-shot: pos=(3,3) result=miss
            10:00:00.020 shot: pos=(5,5) result=hit
            10:00:00.030 enemy-shot: pos=(0,0) result=hit
            10:00:00.040 shot: pos=(5,6) result=sunk ship-size=2
            10:00:00.050 game-over: result=win total-shots=2 enemy-total-shots=2
            10:00:00.050 enemy-ship: size=2 pos=(5,5) dir=vertical
            """.trimIndent()
    }
}
