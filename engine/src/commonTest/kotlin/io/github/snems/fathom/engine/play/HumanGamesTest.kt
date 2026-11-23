package io.github.snems.fathom.engine.play

import io.github.snems.fathom.SampleFleets
import io.github.snems.fathom.board.Board
import io.github.snems.fathom.board.cells
import io.github.snems.fathom.engine.Engine
import io.github.snems.fathom.engine.board.Ship
import io.github.snems.fathom.engine.board.Target
import io.github.snems.fathom.engine.games.Contestant
import io.github.snems.fathom.game.Player
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.collections.shouldBeEmpty
import io.kotest.matchers.collections.shouldContainExactly
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.nulls.shouldBeNull
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import kotlin.test.Test
import kotlin.time.TestTimeSource

class HumanGamesTest {
    private val engine = Engine(TestTimeSource())

    @Test
    fun shouldWaitForTheHumanBeforeTheFirstShot() {
        // when
        val game = engine.play(request(firstShooter = Player.ONE))

        // then
        game.yourTurn shouldBe true
        game.over shouldBe false
        game.game.shots.shouldBeEmpty()
        game.game.result.shouldBeNull()
    }

    @Test
    fun shouldAnswerAShotOfTheHumanWithTheShotsOfTheOpponent() {
        // given
        val shot = Target(x = 0, y = 0)

        // when
        val game = engine.play(request(firstShooter = Player.ONE, shots = listOf(shot)))

        // then
        game.yourTurn shouldBe true
        game.game.shots.first().let { it.player to Target(it.x, it.y) } shouldBe (Player.ONE to shot)
        game.game.shots.last().player shouldBe Player.TWO
    }

    @Test
    fun shouldPlayTheSameGameAgainWhenAShotIsAdded() {
        // given
        val before = engine.play(request(shots = ROW_BY_ROW.take(3)))

        // when
        val after = engine.play(request(shots = ROW_BY_ROW.take(4)))

        // then
        after.game.shots.take(before.game.shots.size).map { Target(it.x, it.y) } shouldBe
            before.game.shots.map { Target(it.x, it.y) }
    }

    @Test
    fun shouldHideTheOpponentWhileTheGameIsOn() {
        // when
        val game = engine.play(request(shots = ROW_BY_ROW.take(3))).game

        // then
        game.fleets.getValue(Player.TWO).shouldBeEmpty()
        game.shots.filter { it.player == Player.TWO }.forEach { it.weights.shouldBeNull() }
    }

    @Test
    fun shouldShowTheWholeGameOnceItIsOver() {
        // given: the opponent sinks a fleet long before a human who shoots row by row
        var shots = 0
        var game = engine.play(request())

        // when
        while (!game.over) game = engine.play(request(shots = ROW_BY_ROW.take(++shots)))

        // then
        game.yourTurn shouldBe false
        game.game.result.shouldNotBeNull().winner shouldBe Player.TWO
        game.game.fleets.getValue(Player.TWO) shouldHaveSize SampleFleets.COMPLETE.size
        game.game.shots.last { it.player == Player.TWO }.weights.shouldNotBeNull()
    }

    @Test
    fun shouldShowAShipOfTheOpponentOnceTheHumanHasSunkIt() {
        // given
        val ship = fleetOfTheOpponent().first()

        // when
        val game = engine.play(request(shots = cellsOf(listOf(ship))))

        // then
        game.over shouldBe false
        game.game.fleets.getValue(Player.TWO) shouldContainExactly listOf(ship)
    }

    @Test
    fun shouldLetTheHumanWin() {
        // given: a human who knows where every ship is
        val shots = cellsOf(fleetOfTheOpponent())

        // when
        val game = engine.play(request(shots = shots))

        // then
        game.over shouldBe true
        game.yourTurn shouldBe false
        game.game.result.shouldNotBeNull().winner shouldBe Player.ONE
    }

    @Test
    fun shouldLetTheOpponentShootFirstWhenAsked() {
        // when
        val game = engine.play(request(firstShooter = Player.TWO))

        // then
        game.yourTurn shouldBe true
        game.game.shots.first().player shouldBe Player.TWO
    }

    @Test
    fun shouldRefuseTwoShotsAtOneCell() {
        // given
        val twice = listOf(Target(0, 0), Target(0, 0))

        // when, then
        shouldThrow<IllegalArgumentException> { engine.play(request(shots = twice)) }
    }

    @Test
    fun shouldRefuseAShotOffTheBoard() {
        // given
        val offTheBoard = listOf(Target(Board.SIZE, 0))

        // when, then
        shouldThrow<IllegalArgumentException> { engine.play(request(shots = offTheBoard)) }
    }

    @Test
    fun shouldRefuseShotsAfterTheGameWasOver() {
        // given: the opponent wins long before a human has shot at every cell
        val everyCell = ROW_BY_ROW

        // when, then
        shouldThrow<IllegalArgumentException> { engine.play(request(shots = everyCell)) }
    }

    @Test
    fun shouldRefuseAFleetThatIsNotWhole() {
        // given
        val fleet = SampleFleets.COMPLETE.drop(1).map(Ship::of)

        // when, then
        shouldThrow<IllegalArgumentException> { engine.play(request().copy(fleet = fleet)) }
    }

    /**
     * The fleet of the opponent, which a game shows once it is over.
     */
    private fun fleetOfTheOpponent(): List<Ship> {
        var shots = 0
        var game = engine.play(request())
        while (!game.over) game = engine.play(request(shots = ROW_BY_ROW.take(++shots)))
        return game.game.fleets.getValue(Player.TWO)
    }

    private fun cellsOf(ships: List<Ship>): List<Target> =
        ships.flatMap { it.placement().cells() }.map { Target(it.x, it.y) }

    private fun request(
        firstShooter: Player? = null,
        shots: List<Target> = emptyList(),
    ) = HumanGameRequest(SampleFleets.COMPLETE.map(Ship::of), OPPONENT, SEED, firstShooter, shots)

    private companion object {
        const val SEED = 3L
        val OPPONENT = Contestant("sequential", "density")
        val ROW_BY_ROW = Board.positions.map { Target(it.x, it.y) }
    }
}
