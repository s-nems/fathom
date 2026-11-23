package io.github.snems.fathom.engine.logs

import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.github.snems.fathom.game.GameResult.Ending
import io.github.snems.fathom.game.Player
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import jd.mg.ships.tournament.api.ShotResult
import java.nio.file.Path
import kotlin.io.path.readText
import kotlin.test.Test

/**
 * Reads a log the program wrote, which takes a file and so the JVM.
 */
class ProgramLogTest {
    @Test
    fun shouldReadALogOfTheProgramWithEveryShipOfBothFleets() {
        // given
        val log = Path.of(LOG)

        // when
        val game = GameLogReader.read(TITLE, log.readText())

        // then
        val result = checkNotNull(game.result)
        game.fleets.values.forEach { ships -> ships.map { it.size } shouldBe FLEET_SHIP_SIZES }
        game.shots.filter { it.result == ShotResult.SUNK }.forEach { it.sunk shouldNotBe null }
        Player.entries.forEach { player ->
            game.shots.count { it.player == player } shouldBe
                result.shots.getValue(player)
        }
        result.ending shouldBe Ending.FLEET_SUNK
    }

    private companion object {
        const val TITLE = "a log"
        const val LOG = "../app/src/test/resources/logs/ships-game-20261120-133145.log"
    }
}
