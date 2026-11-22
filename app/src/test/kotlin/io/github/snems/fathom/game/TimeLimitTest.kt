package io.github.snems.fathom.game

import io.github.snems.fathom.SampleFleets.COMPLETE
import io.github.snems.fathom.ScriptedBot
import io.github.snems.fathom.board.cells
import io.github.snems.fathom.game.GameResult.Ending.FLEET_SUNK
import io.github.snems.fathom.game.GameResult.Ending.TIME_LIMIT
import io.kotest.matchers.collections.shouldBeEmpty
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.Test
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.TestTimeSource

class TimeLimitTest {
    private val everyShipCell = COMPLETE.flatMap { it.cells() }
    private val time = TestTimeSource()
    private val tooLong = Game.MOVE_TIME_LIMIT + 1.milliseconds

    @Test
    fun shouldForfeitOnTheFirstMoveOverTheLimit() {
        // given
        var slowMoves = 1
        val slowOnce = ScriptedBot(shots = everyShipCell, beforeMove = { if (slowMoves-- > 0) time += tooLong })
        val game = Game(slowOnce, ScriptedBot(), Player.ONE, timeSource = time)

        // when
        val result = game.play()

        // then
        result.winner shouldBe Player.TWO
        result.ending shouldBe TIME_LIMIT
        result.fleetOf(Player.ONE).shouldBeEmpty()
    }

    @Test
    fun shouldAllowAMoveThatTakesExactlyTheLimit() {
        // given
        val justInTime = ScriptedBot(shots = everyShipCell, beforeMove = { time += Game.MOVE_TIME_LIMIT })
        val game = Game(justInTime, ScriptedBot(), Player.ONE, timeSource = time)

        // when
        val result = game.play()

        // then
        result.winner shouldBe Player.ONE
        result.ending shouldBe FLEET_SUNK
    }

    @Test
    fun shouldForfeitWhenTakingAShotResultIsOverTheLimit() {
        // given
        val slowListener = ScriptedBot(shots = everyShipCell, onResult = { time += tooLong })
        val game = Game(slowListener, ScriptedBot(), Player.ONE, timeSource = time)

        // when
        val result = game.play()

        // then
        result.winner shouldBe Player.TWO
        result.ending shouldBe TIME_LIMIT
        result.shotsBy(Player.ONE) shouldBe 1
        result.shotsBy(Player.TWO) shouldBe 0
    }

    @Test
    fun shouldLetTheSinkingShotWinEvenWhenItsResultIsTakenSlowly() {
        // given
        var results = 0
        val slowAtTheEnd =
            ScriptedBot(shots = everyShipCell, onResult = { if (++results == everyShipCell.size) time += tooLong })
        val game = Game(slowAtTheEnd, ScriptedBot(), Player.ONE, timeSource = time)

        // when
        val result = game.play()

        // then
        result.winner shouldBe Player.ONE
        result.ending shouldBe FLEET_SUNK
    }
}
