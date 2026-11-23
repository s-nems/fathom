package io.github.snems.fathom.engine

import io.github.snems.fathom.arena.ShootingRange
import io.github.snems.fathom.arena.estimate
import io.github.snems.fathom.arena.layouts.LayoutKind
import io.github.snems.fathom.arena.shooters.ShooterKind
import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.github.snems.fathom.engine.board.SHOT_COUNTS
import io.github.snems.fathom.engine.catalogue.LayoutDrawRequest
import io.github.snems.fathom.engine.games.Contestant
import io.github.snems.fathom.engine.games.GameRequest
import io.github.snems.fathom.engine.heat.LayoutHeatRequest
import io.github.snems.fathom.engine.heat.ShooterHeatRequest
import io.github.snems.fathom.engine.measure.CellChunkRequest
import io.github.snems.fathom.engine.measure.MeasurementRequest
import io.github.snems.fathom.engine.measure.RunPart
import io.github.snems.fathom.game.GameResult.Ending
import io.github.snems.fathom.game.Player
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.collections.shouldContain
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.doubles.plusOrMinus
import io.kotest.matchers.shouldBe
import kotlin.test.Test
import kotlin.time.TestTimeSource

class EngineTest {
    private val engine = Engine(TestTimeSource())

    @Test
    fun shouldOfferTheLayoutSourcesAndShootersOfTheArena() {
        // when
        val catalogue = engine.catalogue()

        // then
        catalogue.layouts shouldBe LayoutKind.entries.map { it.label }
        catalogue.shooters shouldBe ShooterKind.entries.map { it.label }
    }

    @Test
    fun shouldPlayTheSameGameForTheSameRequest() {
        // given
        val request = GameRequest(Contestant("fathom", "density"), Contestant("shuffled", "hunt-target"), SEED)

        // when
        val game = engine.play(request)

        // then
        game.result?.ending shouldBe Ending.FLEET_SUNK
        game.fleets.getValue(Player.ONE) shouldHaveSize FLEET_SHIP_SIZES.size
        game shouldBe Engine(TestTimeSource()).play(request)
    }

    @Test
    fun shouldMeasureAPartOfACellAsTheArenaMeasuresTheWholeCell() {
        // given
        val layouts = LayoutKind.SHUFFLED
        val shooter = ShooterKind.DENSITY_INFORMED
        val arena = ShootingRange(layouts.source, GAMES, SEED).shotsToSink(shooter.against(layouts.source, SEED))

        // when
        val first = engine.cellChunk(CellChunkRequest(shooter.label, layouts.label, SEED, firstGame = 0, FIRST_PART))
        val rest =
            engine.cellChunk(CellChunkRequest(shooter.label, layouts.label, SEED, FIRST_PART, GAMES - FIRST_PART))

        // then
        val whole = first.histogram.zip(rest.histogram, Int::plus)
        whole shouldBe histogramOf(arena)
        val measured = engine.measurement(MeasurementRequest(shooter.label, layouts.label, whole))
        measured.mean shouldBe arena.estimate().mean
        measured.margin shouldBe (arena.estimate().margin plusOrMinus ROUNDING)
    }

    @Test
    fun shouldRefuseAPartWithoutGames() {
        // when, then
        shouldThrow<IllegalArgumentException> {
            engine.cellChunk(CellChunkRequest("density", "shuffled", SEED, firstGame = 0, games = 0))
        }
    }

    @Test
    fun shouldPlayTheGamesTheJvmAndTheBrowserBothPlay() {
        // given: the same requests and histograms as in check-bundle.mjs, which asks the built bundle

        // when
        val bot = engine.cellChunk(CellChunkRequest("fathom", "fathom", SEED, firstGame = 0, GOLDEN_GAMES))
        val cheap = engine.cellChunk(CellChunkRequest("hunt-target", "shuffled", SEED, firstGame = 0, GOLDEN_GAMES))

        // then
        gamesByShots(bot.histogram) shouldBe GOLDEN_BOT
        gamesByShots(cheap.histogram) shouldBe GOLDEN_CHEAP
    }

    @Test
    fun shouldRefuseAPartBeforeTheFirstGame() {
        // when, then
        shouldThrow<IllegalArgumentException> {
            engine.cellChunk(CellChunkRequest("density", "shuffled", SEED, firstGame = -1, games = 1))
        }
        shouldThrow<IllegalArgumentException> {
            engine.shooterHeat(ShooterHeatRequest("density", "shuffled", games = 1, SEED, firstGame = -1))
        }
    }

    @Test
    fun shouldRefuseAPartPastTheLastGameOfARun() {
        // given
        val lastGame = (RunPart.RUN_GAMES - 1).toInt()

        // when, then
        shouldThrow<IllegalArgumentException> {
            engine.cellChunk(CellChunkRequest("density", "shuffled", SEED, firstGame = lastGame, games = 2))
        }
        shouldThrow<IllegalArgumentException> {
            engine.shooterHeat(ShooterHeatRequest("density", "shuffled", games = 2, SEED, firstGame = lastGame))
        }
    }

    @Test
    fun shouldMeasureAHistogramOfMoreGamesThanFitInMemory() {
        // given
        val histogram =
            List(SHOT_COUNTS) { shots ->
                if (shots == FEW_SHOTS ||
                    shots == MANY_SHOTS
                ) {
                    Int.MAX_VALUE
                } else {
                    0
                }
            }

        // when
        val measured = engine.measurement(MeasurementRequest("density", "shuffled", histogram))

        // then
        measured.mean shouldBe (FEW_SHOTS + MANY_SHOTS) / 2.0
        measured.histogram shouldBe histogram
    }

    @Test
    fun shouldRefuseAHistogramWithANegativeCount() {
        // given
        val histogram = List(SHOT_COUNTS) { shots -> if (shots == FEW_SHOTS) -1 else GAMES }

        // when, then
        shouldThrow<IllegalArgumentException> {
            engine.measurement(MeasurementRequest("density", "shuffled", histogram))
        }
    }

    @Test
    fun shouldRefuseAHistogramThatIsNotOneOfShotCounts() {
        // when, then
        shouldThrow<IllegalArgumentException> {
            engine.measurement(MeasurementRequest("density", "shuffled", listOf(GAMES)))
        }
    }

    @Test
    fun shouldCountTheShotsOfARunInPartsThatAddUp() {
        // given
        val whole = engine.shooterHeat(ShooterHeatRequest("density", "shuffled", GAMES, SEED))

        // when
        val first = engine.shooterHeat(ShooterHeatRequest("density", "shuffled", FIRST_PART, SEED))
        val rest = engine.shooterHeat(ShooterHeatRequest("density", "shuffled", GAMES - FIRST_PART, SEED, FIRST_PART))

        // then
        val added = first.turns.zip(rest.turns) { one, other -> one.zip(other, Int::plus) }
        added shouldBe whole.turns
        whole.turns.first().sum() shouldBe GAMES
    }

    @Test
    fun shouldCountWhereALayoutSourcePlacesItsShips() {
        // when
        val heat = engine.layoutHeat(LayoutHeatRequest("sequential", GAMES, SEED))

        // then
        heat.cells.sum() shouldBe GAMES * FLEET_SHIP_SIZES.sum()
    }

    @Test
    fun shouldDrawOneFleetOfALayoutSource() {
        // when
        val fleet = engine.drawLayout(LayoutDrawRequest("sequential", SEED))

        // then
        fleet.map { it.size } shouldBe FLEET_SHIP_SIZES
    }

    @Test
    fun shouldTellTheLimitsOfItsCalls() {
        // when
        val limits = engine.catalogue().limits

        // then
        limits.partGames shouldBe RunPart.GAMES.last
        limits.runGames shouldBe RunPart.RUN_GAMES
    }

    @Test
    fun shouldReadAGameLog() {
        // given
        val log =
            """
            19:05:03.042 place-ship: size=2 pos=(0,0) dir=horizontal
            19:05:03.050 shot: pos=(4,4) result=miss
            19:05:03.060 enemy-shot: pos=(0,0) result=hit
            """.trimIndent()

        // when
        val game = engine.readLog("a game", log)

        // then
        game.title shouldBe "a game"
        game.shots.map { it.player } shouldBe listOf(Player.ONE, Player.TWO)
        game.shots.map { it.at } shouldContain "19:05:03.060"
    }

    private fun histogramOf(shots: IntArray): List<Int> = List(SHOT_COUNTS) { taken -> shots.count { it == taken } }

    private fun gamesByShots(histogram: List<Int>): Map<Int, Int> =
        histogram.withIndex().filter { it.value > 0 }.associate { it.index to it.value }

    private companion object {
        const val SEED = 7L
        const val GAMES = 12
        const val FIRST_PART = 5
        const val FEW_SHOTS = 40
        const val MANY_SHOTS = 60
        const val GOLDEN_GAMES = 6

        /**
         * Games by the shots they took, as the JVM plays them. check-bundle.mjs holds the same numbers.
         */
        val GOLDEN_BOT = mapOf(49 to 1, 50 to 3, 51 to 1, 58 to 1)
        val GOLDEN_CHEAP = mapOf(53 to 1, 59 to 2, 63 to 1, 65 to 1, 70 to 1)

        /**
         * The engine adds the games up in the order of their shot counts, the arena in the order played.
         */
        const val ROUNDING = 1e-9
    }
}
