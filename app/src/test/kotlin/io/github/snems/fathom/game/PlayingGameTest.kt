package io.github.snems.fathom.game

import io.github.snems.fathom.PlacementCall
import io.github.snems.fathom.SampleFleets.COMPLETE
import io.github.snems.fathom.SampleFleets.TRANSPOSED
import io.github.snems.fathom.ScriptedBot
import io.github.snems.fathom.board.Board
import io.github.snems.fathom.board.cells
import io.github.snems.fathom.game.GameEvent.GameOver
import io.github.snems.fathom.game.GameEvent.ShipPlaced
import io.github.snems.fathom.game.GameEvent.ShotFired
import io.github.snems.fathom.game.GameResult.Ending.FLEET_SUNK
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.collections.shouldContainExactly
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.collections.shouldNotContain
import io.kotest.matchers.shouldBe
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.Shot
import jd.mg.ships.tournament.api.ShotResult.HIT
import jd.mg.ships.tournament.api.ShotResult.MISS
import jd.mg.ships.tournament.api.ShotResult.SUNK
import org.junit.jupiter.api.Test

class PlayingGameTest {
    private val events = mutableListOf<GameEvent>()

    /**
     * Places [COMPLETE], knows where the other fleet is and never misses.
     */
    private val sniper = ScriptedBot(placements = COMPLETE, shots = TRANSPOSED.flatMap { it.cells() })

    /**
     * Places [TRANSPOSED] and shoots at every cell, row by row.
     */
    private val sweeper = ScriptedBot(placements = TRANSPOSED, shots = Board.positions)

    @Test
    fun shouldAskForOneShipAtATimeWithTheFleetSoFar() {
        // given
        val game = Game(sniper, sweeper, Player.ONE)

        // when
        game.play()

        // then
        sniper.placementCalls shouldHaveSize COMPLETE.size
        sniper.placementCalls[0] shouldBe PlacementCall(emptyList(), listOf(5, 4, 4, 3, 3, 3, 2, 2, 2, 2))
        sniper.placementCalls[1] shouldBe PlacementCall(COMPLETE.take(1), listOf(4, 4, 3, 3, 3, 2, 2, 2, 2))
        sniper.placementCalls.last() shouldBe PlacementCall(COMPLETE.dropLast(1), listOf(2))
    }

    @Test
    fun shouldReportShipsInTheOrderTheyArePlaced() {
        // given
        val game = Game(sniper, sweeper, Player.ONE, observer = events::add)

        // when
        game.play()

        // then
        val placed = events.filterIsInstance<ShipPlaced>()
        placed.filter { it.player == Player.ONE }.map { it.ship } shouldContainExactly COMPLETE
        placed.filter { it.player == Player.TWO }.map { it.ship } shouldContainExactly TRANSPOSED
    }

    @Test
    fun shouldEndWhenTheLastShipIsSunk() {
        // given
        val game = Game(sniper, sweeper, Player.ONE)

        // when
        val result = game.play()

        // then
        result.winner shouldBe Player.ONE
        result.ending shouldBe FLEET_SUNK
        result.shotsBy(Player.ONE) shouldBe SHIP_CELLS
        result.shotsBy(Player.TWO) shouldBe SHIP_CELLS - 1
        result.fleetOf(Player.ONE) shouldBe COMPLETE
        result.fleetOf(Player.TWO) shouldBe TRANSPOSED
    }

    @Test
    fun shouldLetTheOtherPlayerShootFirst() {
        // given
        val game = Game(sniper, sweeper, Player.TWO)

        // when
        val result = game.play()

        // then
        result.winner shouldBe Player.ONE
        result.shotsBy(Player.ONE) shouldBe SHIP_CELLS
        result.shotsBy(Player.TWO) shouldBe SHIP_CELLS
    }

    @Test
    fun shouldPassTheTurnAfterEveryShotEvenAHit() {
        // given
        val game = Game(sniper, sweeper, Player.ONE, observer = events::add)

        // when
        game.play()

        // then
        val shooters = events.filterIsInstance<ShotFired>().map { it.player }
        shooters.first() shouldBe Player.ONE
        shooters.zipWithNext().all { (earlier, later) -> earlier != later } shouldBe true
    }

    @Test
    fun shouldAnswerEachShotAgainstTheFleetOfTheOtherPlayer() {
        // given
        val game = Game(sniper, sweeper, Player.ONE)

        // when
        game.play()

        // then
        val carrier = COMPLETE.first()
        sweeper.results.take(6) shouldContainExactly
            listOf(
                Shot(Position(0, 0), HIT),
                Shot(Position(1, 0), HIT),
                Shot(Position(2, 0), HIT),
                Shot(Position(3, 0), HIT),
                Shot(Position(4, 0), SUNK, carrier),
                Shot(Position(5, 0), MISS),
            )
        sniper.results.count { it.result == SUNK } shouldBe TRANSPOSED.size
    }

    @Test
    fun shouldOfferOnlyCellsNotShotAtBefore() {
        // given
        val game = Game(sniper, sweeper, Player.ONE)

        // when
        game.play()

        // then
        sweeper.offeredShots[0] shouldContainExactly Board.positions
        sweeper.offeredShots[1] shouldHaveSize Board.positions.size - 1
        sweeper.offeredShots[1] shouldNotContain Position(0, 0)
    }

    @Test
    fun shouldReportGameOverLast() {
        // given
        val game = Game(sniper, sweeper, Player.ONE, observer = events::add)

        // when
        val result = game.play()

        // then
        events.last() shouldBe GameOver(result)
        events.filterIsInstance<GameOver>() shouldHaveSize 1
    }

    @Test
    fun shouldRefuseToBePlayedTwice() {
        // given
        val game = Game(sniper, sweeper, Player.ONE)
        game.play()

        // when, then
        shouldThrow<IllegalStateException> { game.play() }
    }

    private companion object {
        const val SHIP_CELLS = 30
    }
}
