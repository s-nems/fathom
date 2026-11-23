package io.github.snems.fathom.engine.games

import io.github.snems.fathom.board.cells
import io.github.snems.fathom.engine.board.CELLS
import io.github.snems.fathom.engine.board.Ship
import io.github.snems.fathom.engine.board.cell
import io.github.snems.fathom.engine.catalogue.ShooterFactories
import io.github.snems.fathom.game.Fleet
import io.github.snems.fathom.game.GameResult.Ending
import io.github.snems.fathom.game.Player
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.collections.shouldContainAll
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import kotlin.test.Test
import kotlin.time.TestTimeSource

class GamesTest {
    private val games = Games(Sides(ShooterFactories(), TestTimeSource()))

    @Test
    fun shouldPlayTheSameGameForTheSameRequest() {
        // given
        val request = GameRequest(HUNTER, DENSITY, SEED)

        // when
        val first = games.play(request)
        val second = games.play(request)

        // then
        first shouldBe second
    }

    @Test
    fun shouldPlayUntilTheWinnerHasSunkAWholeLegalFleet() {
        // when
        val game = games.play(GameRequest(HUNTER, DENSITY, SEED))

        // then
        val result = checkNotNull(game.result)
        val loser = game.fleets.getValue(result.winner.opponent).map(Ship::placement)
        val struck = game.shots.filter { it.player == result.winner }.map { it.position() }
        result.ending shouldBe Ending.FLEET_SUNK
        loser.fold(Fleet.EMPTY, Fleet::place).isComplete shouldBe true
        struck shouldContainAll loser.flatMap { it.cells() }
        result.shots.getValue(result.winner) shouldBe struck.size
    }

    @Test
    fun shouldLetTheNamedPlayerShootFirst() {
        // when
        val played = Player.entries.map { first -> games.play(GameRequest(HUNTER, DENSITY, SEED, first)) }

        // then
        played.map { it.shots.first().player } shouldBe Player.entries
    }

    @Test
    fun shouldRecordTheWeightsOfAShooterThatWeighsCells() {
        // when
        val game = games.play(GameRequest(one = DENSITY, two = HUNTER, SEED))

        // then
        val byPlayer = game.shots.groupBy { it.player }
        byPlayer.getValue(Player.ONE).forEach { checkNotNull(it.weights) shouldHaveSize CELLS }
        byPlayer.getValue(Player.TWO).forEach { it.weights shouldBe null }
    }

    @Test
    fun shouldRecordTheWeightsTheBotPickedItsShotFrom() {
        // when
        val game = games.play(GameRequest(one = FATHOM, two = HUNTER, SEED))

        // then: the bot shoots at a cell it weighed heaviest among the cells still open
        val shots = game.shots.filter { it.player == Player.ONE }
        shots.first().weights shouldNotBe null
        shots.forEachIndexed { turn, shot ->
            val weights = shot.weights ?: return@forEachIndexed
            val taken = shots.take(turn).map { it.position().cell() }.toSet()
            val heaviest = weights.filterIndexed { cell, _ -> cell !in taken }.max()
            weights[shot.position().cell()] shouldBe heaviest
        }
    }

    @Test
    fun shouldNameTheGameAndItsPlayersAfterTheSides() {
        // when
        val game = games.play(GameRequest(HUNTER, DENSITY, SEED))

        // then
        game.title shouldBe "sequential / hunt-target vs shuffled / density"
        game.players shouldBe mapOf(Player.ONE to "sequential / hunt-target", Player.TWO to "shuffled / density")
    }

    @Test
    fun shouldRefuseANameTheCatalogueDoesNotHave() {
        // when, then
        shouldThrow<IllegalArgumentException> {
            games.play(GameRequest(HUNTER, Contestant("sequential", "psychic"), SEED))
        }
        shouldThrow<IllegalArgumentException> { games.play(GameRequest(Contestant("nowhere", "random"), HUNTER, SEED)) }
    }

    private companion object {
        const val SEED = 11L
        val HUNTER = Contestant("sequential", "hunt-target")
        val DENSITY = Contestant("shuffled", "density")
        val FATHOM = Contestant("sequential", "fathom")
    }
}
