package io.github.snems.fathom.bot

import io.github.snems.fathom.SampleFleets.ship
import io.github.snems.fathom.board.Board
import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.github.snems.fathom.game.Game
import io.github.snems.fathom.game.GameEvent
import io.github.snems.fathom.game.GameEvent.BotFailed
import io.github.snems.fathom.game.GameResult.Ending
import io.github.snems.fathom.game.Player
import io.kotest.assertions.throwables.shouldNotThrowAny
import io.kotest.matchers.collections.shouldBeEmpty
import io.kotest.matchers.collections.shouldBeIn
import io.kotest.matchers.shouldBe
import jd.mg.ships.tournament.api.Direction.HORIZONTAL
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.Shot
import jd.mg.ships.tournament.api.ShotResult.HIT
import jd.mg.ships.tournament.api.ShotResult.SUNK
import org.junit.jupiter.api.Test
import kotlin.random.Random
import kotlin.time.AbstractLongTimeSource
import kotlin.time.DurationUnit
import kotlin.time.TestTimeSource

class FathomBotTest {
    @Test
    fun shouldHaveAPublicConstructorWithoutArguments() {
        // when, then
        shouldNotThrowAny { FathomBot::class.java.getConstructor().newInstance() }
    }

    @Test
    fun shouldPlayWholeGamesWithoutAFailedMove() {
        repeat(GAMES) { seed ->
            // given
            val events = mutableListOf<GameEvent>()
            val random = Random(seed)
            val first = Player.entries.random(random)
            val game = Game(quickBot(random), quickBot(random), first, events::add, timeSource = TestTimeSource())

            // when
            val result = game.play()

            // then
            result.ending shouldBe Ending.FLEET_SUNK
            events.filterIsInstance<BotFailed>().shouldBeEmpty()
        }
    }

    @Test
    fun shouldAnswerInsteadOfThrowingWhenAskedToPlaceNothing() {
        // given
        val bot = untimedBot(Random(SEED))

        // when, then
        shouldNotThrowAny { bot.placeShip(emptyList(), emptyList()) }
    }

    @Test
    fun shouldAnswerWithTheSizeAskedForEvenWhenItIsNotInTheFleet() {
        // given
        val bot = untimedBot(Random(SEED))

        // when
        val ship = bot.placeShip(emptyList(), listOf(UNKNOWN_SIZE))

        // then
        ship.size shouldBe UNKNOWN_SIZE
    }

    @Test
    fun shouldPlaceAShipAmongShipsThatAreOffTheBoard() {
        // given
        val bot = untimedBot(Random(SEED))
        val offTheBoard = listOf(ship(5, 8, 0, HORIZONTAL), ship(4, -3, 40, HORIZONTAL))

        // when
        val ship = bot.placeShip(offTheBoard, FLEET_SHIP_SIZES.drop(2))

        // then
        ship.size shouldBe FLEET_SHIP_SIZES[2]
    }

    @Test
    fun shouldAnswerInsteadOfThrowingWhenOfferedNoCell() {
        // given
        val bot = untimedBot(Random(SEED))

        // when, then
        shouldNotThrowAny { bot.chooseShot(emptyList()) }
    }

    @Test
    fun shouldIgnoreCellsOffTheBoard() {
        // given
        val bot = untimedBot(Random(SEED))
        val onBoard = Position(3, 3)

        // when
        bot.onShotResult(Shot(Position(10, 3), HIT))
        bot.onShotResult(Shot(Position(-1, -1), SUNK, ship(2, -1, -1, HORIZONTAL)))
        val shot = bot.chooseShot(listOf(Position(10, 3), onBoard, Position(0, 12)))

        // then
        shot shouldBeIn listOf(onBoard)
    }

    @Test
    fun shouldStopImprovingAnAnswerWhenItsTimeIsUp() {
        // given
        val clock = JumpingTimeSource()
        val bot = FathomBot(Random(SEED), timeSource = clock)
        val readsBefore = clock.reads

        // when
        bot.placeShip(emptyList(), FLEET_SHIP_SIZES)
        val readsToPlace = clock.reads - readsBefore
        bot.chooseShot(Board.positions)
        val readsToShoot = clock.reads - readsBefore - readsToPlace

        // then: the clock is read once to start the time and once more to find it is up
        readsToPlace shouldBe READS_OF_AN_ANSWER_OUT_OF_TIME
        readsToShoot shouldBe READS_OF_AN_ANSWER_OUT_OF_TIME
    }

    /** A clock that jumps ahead by more than the bot's time for one answer each time it is read. */
    private class JumpingTimeSource : AbstractLongTimeSource(DurationUnit.SECONDS) {
        var reads = 0L
            private set

        init {
            // The first mark of a time source reads it once more than the later ones, to find its zero.
            markNow()
        }

        override fun read(): Long = reads++
    }

    /** The bot with few samples per shot, so that many whole games stay fast. */
    private fun quickBot(random: Random) =
        untimedBot(random, samplerSettings = SamplerSettings(samples = QUICK_SAMPLES))

    private companion object {
        const val SEED = 7
        const val GAMES = 100
        const val QUICK_SAMPLES = 50
        const val UNKNOWN_SIZE = 7
        const val READS_OF_AN_ANSWER_OUT_OF_TIME = 2L
    }
}
