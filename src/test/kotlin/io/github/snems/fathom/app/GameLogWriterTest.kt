package io.github.snems.fathom.app

import io.github.snems.fathom.SampleFleets.ship
import io.github.snems.fathom.game.GameEvent.BotFailed
import io.github.snems.fathom.game.GameEvent.GameOver
import io.github.snems.fathom.game.GameEvent.ShipPlaced
import io.github.snems.fathom.game.GameEvent.ShotFired
import io.github.snems.fathom.game.GameResult
import io.github.snems.fathom.game.GameResult.Ending
import io.github.snems.fathom.game.Player
import io.kotest.matchers.shouldBe
import jd.mg.ships.tournament.api.Direction.HORIZONTAL
import jd.mg.ships.tournament.api.Direction.VERTICAL
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.Shot
import jd.mg.ships.tournament.api.ShotResult.HIT
import jd.mg.ships.tournament.api.ShotResult.MISS
import jd.mg.ships.tournament.api.ShotResult.SUNK
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class GameLogWriterTest {
    private val clock = Clock.fixed(Instant.parse("2026-03-09T19:05:03.042Z"), ZoneOffset.UTC)
    private val out = StringBuilder()
    private val log = GameLogWriter(out, clock)

    private val ownShip = ship(5, 9, 3, VERTICAL)
    private val enemyShip = ship(2, 0, 5, HORIZONTAL)

    @Test
    fun shouldWriteOwnShipsAndLeaveOutEnemyOnes() {
        // when
        log.on(ShipPlaced(Player.ONE, ownShip))
        log.on(ShipPlaced(Player.TWO, enemyShip))

        // then
        out.toString() shouldBe "19:05:03.042 place-ship: size=5 pos=(9,3) dir=vertical\n"
    }

    @Test
    fun shouldWriteShotsOfBothPlayers() {
        // when
        log.on(ShotFired(Player.ONE, Shot(Position(0, 2), MISS)))
        log.on(ShotFired(Player.TWO, Shot(Position(9, 4), HIT)))
        log.on(ShotFired(Player.ONE, Shot(Position(1, 5), SUNK, enemyShip)))
        log.on(ShotFired(Player.TWO, Shot(Position(9, 7), SUNK, ownShip)))

        // then
        out.toString() shouldBe
            """
            19:05:03.042 shot: pos=(0,2) result=miss
            19:05:03.042 enemy-shot: pos=(9,4) result=hit
            19:05:03.042 shot: pos=(1,5) result=sunk ship-size=2
            19:05:03.042 enemy-shot: pos=(9,7) result=sunk ship-size=5

            """.trimIndent()
    }

    @Test
    fun shouldWriteWinWithShotCountsAndEnemyShips() {
        // given
        val result = resultWonBy(Player.ONE)

        // when
        log.on(GameOver(result))

        // then
        out.toString() shouldBe
            """
            19:05:03.042 game-over: result=win total-shots=48 enemy-total-shots=47
            19:05:03.042 enemy-ship: size=2 pos=(0,5) dir=horizontal

            """.trimIndent()
    }

    @Test
    fun shouldWriteLossWhenTheOtherPlayerWins() {
        // given
        val result = resultWonBy(Player.TWO)

        // when
        log.on(GameOver(result))

        // then
        out.lines().first() shouldBe "19:05:03.042 game-over: result=loss total-shots=48 enemy-total-shots=47"
    }

    @Test
    fun shouldLeaveOutFailedMoves() {
        // when
        log.on(BotFailed(Player.ONE, error = null))

        // then
        out.toString() shouldBe ""
    }

    @Test
    fun shouldNameTheFileAfterTheStartOfTheGame() {
        // when
        val name = logFileName(clock)

        // then
        name shouldBe "ships-game-20260309-190503.log"
    }

    private fun resultWonBy(winner: Player) =
        GameResult(
            winner = winner,
            ending = Ending.FLEET_SUNK,
            shots = mapOf(Player.ONE to OWN_SHOTS, Player.TWO to ENEMY_SHOTS),
            fleets = mapOf(Player.ONE to listOf(ownShip), Player.TWO to listOf(enemyShip)),
        )

    private companion object {
        const val OWN_SHOTS = 48
        const val ENEMY_SHOTS = 47
    }
}
