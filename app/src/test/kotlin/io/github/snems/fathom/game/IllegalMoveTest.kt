package io.github.snems.fathom.game

import io.github.snems.fathom.SampleFleets.COMPLETE
import io.github.snems.fathom.SampleFleets.ship
import io.github.snems.fathom.ScriptedBot
import io.github.snems.fathom.board.Board
import io.github.snems.fathom.board.cells
import io.github.snems.fathom.game.GameEvent.BotFailed
import io.github.snems.fathom.game.GameEvent.ShotFired
import io.github.snems.fathom.game.GameResult.Ending
import io.kotest.matchers.collections.shouldBeEmpty
import io.kotest.matchers.collections.shouldContainExactly
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.shouldBe
import io.kotest.matchers.types.shouldBeInstanceOf
import jd.mg.ships.tournament.api.Direction.HORIZONTAL
import jd.mg.ships.tournament.api.Position
import org.junit.jupiter.api.Test

class IllegalMoveTest {
    private val everyShipCell = COMPLETE.flatMap { it.cells() }
    private val offTheBoard = ship(5, 8, 0, HORIZONTAL)
    private val events = mutableListOf<GameEvent>()

    @Test
    fun shouldAskAgainAfterAnIllegalPlacement() {
        // given
        val hesitant = ScriptedBot(placements = listOf(offTheBoard, offTheBoard) + COMPLETE, shots = everyShipCell)
        val game = Game(hesitant, ScriptedBot(), Player.ONE, observer = events::add)

        // when
        val result = game.play()

        // then
        result.winner shouldBe Player.ONE
        result.fleetOf(Player.ONE) shouldBe COMPLETE
        hesitant.placementCalls.take(3).map { it.ownFleet } shouldContainExactly List(3) { emptyList() }
        events.filterIsInstance<BotFailed>() shouldContainExactly List(2) { BotFailed(Player.ONE, error = null) }
    }

    @Test
    fun shouldForfeitAfterThreeIllegalPlacementsInARow() {
        // given
        val stubborn = ScriptedBot(placements = listOf(offTheBoard, offTheBoard, offTheBoard) + COMPLETE)
        val game = Game(stubborn, ScriptedBot(), Player.ONE, observer = events::add)

        // when
        val result = game.play()

        // then
        result.winner shouldBe Player.TWO
        result.ending shouldBe Ending.ILLEGAL_MOVES
        result.fleetOf(Player.ONE).shouldBeEmpty()
        events.filterIsInstance<ShotFired>().shouldBeEmpty()
    }

    @Test
    fun shouldKeepShipsPlacedBeforeTheSecondPlayerForfeits() {
        // given
        val placements = COMPLETE.take(2) + listOf(offTheBoard, offTheBoard, offTheBoard)
        val game = Game(ScriptedBot(), ScriptedBot(placements), Player.ONE)

        // when
        val result = game.play()

        // then
        result.winner shouldBe Player.ONE
        result.ending shouldBe Ending.ILLEGAL_MOVES
        result.fleetOf(Player.ONE) shouldBe COMPLETE
        result.fleetOf(Player.TWO) shouldBe COMPLETE.take(2)
    }

    @Test
    fun shouldNotForfeitWhenIllegalPlacementsAreNotInARow() {
        // given
        val placements =
            listOf(offTheBoard, offTheBoard, COMPLETE[0], offTheBoard, offTheBoard) + COMPLETE.drop(1)
        val game = Game(ScriptedBot(placements, everyShipCell), ScriptedBot(), Player.ONE)

        // when
        val result = game.play()

        // then
        result.winner shouldBe Player.ONE
        result.ending shouldBe Ending.FLEET_SUNK
    }

    @Test
    fun shouldAskAgainAfterShootingAtTheSameCellTwice() {
        // given
        val first = everyShipCell.first()
        val forgetful = ScriptedBot(shots = listOf(first, first, Position(-1, 0)) + everyShipCell.drop(1))
        val game = Game(forgetful, ScriptedBot(), Player.ONE, observer = events::add)

        // when
        val result = game.play()

        // then
        result.winner shouldBe Player.ONE
        result.shotsBy(Player.ONE) shouldBe everyShipCell.size
        val firedByOne = events.filterIsInstance<ShotFired>().filter { it.player == Player.ONE }
        firedByOne.map { it.shot.position } shouldContainExactly everyShipCell
    }

    @Test
    fun shouldForfeitAfterThreeIllegalShotsInARow() {
        // given
        val first = Board.positions.first()
        val stubborn = ScriptedBot(shots = listOf(first, first, first, first))
        val game = Game(stubborn, ScriptedBot(), Player.ONE)

        // when
        val result = game.play()

        // then
        result.winner shouldBe Player.TWO
        result.ending shouldBe Ending.ILLEGAL_MOVES
        result.shotsBy(Player.ONE) shouldBe 1
        result.shotsBy(Player.TWO) shouldBe 1
    }

    @Test
    fun shouldAskAgainAfterAnException() {
        // given
        var failures = 2
        val shaky = ScriptedBot(shots = everyShipCell, beforeMove = { if (failures-- > 0) error("not ready") })
        val game = Game(shaky, ScriptedBot(), Player.ONE, observer = events::add)

        // when
        val result = game.play()

        // then
        result.winner shouldBe Player.ONE
        result.ending shouldBe Ending.FLEET_SUNK
        val failed = events.filterIsInstance<BotFailed>()
        failed shouldHaveSize 2
        failed.forEach { it.error.shouldBeInstanceOf<IllegalStateException>() }
    }

    @Test
    fun shouldForfeitAfterThreeExceptionsInARow() {
        // given
        val broken = ScriptedBot(beforeMove = { error("broken") })
        val game = Game(broken, ScriptedBot(), Player.ONE)

        // when
        val result = game.play()

        // then
        result.winner shouldBe Player.TWO
        result.ending shouldBe Ending.ILLEGAL_MOVES
    }

    @Test
    fun shouldCarryOnWhenTakingAShotResultThrows() {
        // given
        val careless = ScriptedBot(shots = everyShipCell, onResult = { error("cannot take it") })
        val game = Game(careless, ScriptedBot(), Player.ONE, observer = events::add)

        // when
        val result = game.play()

        // then
        result.winner shouldBe Player.ONE
        result.ending shouldBe Ending.FLEET_SUNK
        events.filterIsInstance<BotFailed>() shouldHaveSize everyShipCell.size
    }
}
