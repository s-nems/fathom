package io.github.snems.fathom.bot

import io.github.snems.fathom.game.Game
import io.github.snems.fathom.game.GameEvent
import io.github.snems.fathom.game.GameEvent.BotFailed
import io.github.snems.fathom.game.GameResult.Ending
import io.github.snems.fathom.game.Player
import io.kotest.matchers.collections.shouldBeEmpty
import io.kotest.matchers.shouldBe
import jd.mg.ships.tournament.api.Bot
import org.junit.jupiter.api.Test
import kotlin.random.Random

class FathomBotTest {
    @Test
    fun shouldHaveAPublicConstructorWithoutArguments() {
        // when
        val bot = FathomBot::class.java.getConstructor().newInstance()

        // then
        (bot is Bot) shouldBe true
    }

    @Test
    fun shouldPlayWholeGamesWithoutAFailedMove() {
        repeat(GAMES) { seed ->
            // given
            val events = mutableListOf<GameEvent>()
            val random = Random(seed)
            val game = Game(FathomBot(random), FathomBot(random), Player.entries.random(random), events::add)

            // when
            val result = game.play()

            // then
            result.ending shouldBe Ending.FLEET_SUNK
            events.filterIsInstance<BotFailed>().shouldBeEmpty()
        }
    }

    private companion object {
        const val GAMES = 200
    }
}
