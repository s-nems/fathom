package io.github.snems.fathom.engine

import io.github.snems.fathom.arena.ShootingRange
import io.github.snems.fathom.engine.board.SHOT_COUNTS
import io.github.snems.fathom.engine.board.Ship
import io.github.snems.fathom.engine.catalogue.CatalogueView
import io.github.snems.fathom.engine.catalogue.LayoutDrawRequest
import io.github.snems.fathom.engine.catalogue.ShooterFactories
import io.github.snems.fathom.engine.catalogue.fleetOf
import io.github.snems.fathom.engine.catalogue.layoutSource
import io.github.snems.fathom.engine.games.GameRecord
import io.github.snems.fathom.engine.games.GameRequest
import io.github.snems.fathom.engine.games.Games
import io.github.snems.fathom.engine.games.Sides
import io.github.snems.fathom.engine.heat.LayoutHeat
import io.github.snems.fathom.engine.heat.LayoutHeatCounter
import io.github.snems.fathom.engine.heat.LayoutHeatRequest
import io.github.snems.fathom.engine.heat.ShooterHeat
import io.github.snems.fathom.engine.heat.ShooterHeatCounter
import io.github.snems.fathom.engine.heat.ShooterHeatRequest
import io.github.snems.fathom.engine.logs.GameLogReader
import io.github.snems.fathom.engine.measure.CellChunk
import io.github.snems.fathom.engine.measure.CellChunkRequest
import io.github.snems.fathom.engine.measure.Measurement
import io.github.snems.fathom.engine.measure.MeasurementRequest
import io.github.snems.fathom.engine.measure.RunPart
import io.github.snems.fathom.engine.play.HumanGame
import io.github.snems.fathom.engine.play.HumanGameRequest
import io.github.snems.fathom.engine.play.HumanGames
import kotlin.time.TimeSource

/**
 * Everything the page asks of the game: the catalogue, whole games, parts of an arena table, heat maps, logs
 * and the game of a human. It keeps nothing between calls but the shooters it has built, so every call can run
 * on any worker. The sides of a game time their choices on the [timeSource].
 */
internal class Engine(
    timeSource: TimeSource,
) {
    private val factories = ShooterFactories()
    private val sides = Sides(factories, timeSource)
    private val games = Games(sides)
    private val humanGames = HumanGames(sides)
    private val shooterHeat = ShooterHeatCounter(factories)

    fun catalogue(): CatalogueView = CatalogueView.ofTheArena()

    /**
     * @throws IllegalArgumentException if the request names something the catalogue does not have
     */
    fun play(request: GameRequest): GameRecord = games.play(request)

    /**
     * @throws IllegalArgumentException if the request cannot be a game of a human
     */
    fun play(request: HumanGameRequest): HumanGame = humanGames.play(request)

    /**
     * @throws IllegalArgumentException if a line is not a line of a game log
     */
    fun readLog(
        title: String,
        text: String,
    ): GameRecord = GameLogReader.read(title, text)

    /**
     * @throws IllegalArgumentException if there is no such source or the count is out of range
     */
    fun layoutHeat(request: LayoutHeatRequest): LayoutHeat =
        LayoutHeatCounter.count(request.source, request.count, request.seed)

    /**
     * @throws IllegalArgumentException if there is no such source
     */
    fun drawLayout(request: LayoutDrawRequest): List<Ship> = fleetOf(request.source, request.seed)

    /**
     * @throws IllegalArgumentException if there is no such shooter or source, or the games are out of range
     */
    fun shooterHeat(request: ShooterHeatRequest): ShooterHeat =
        shooterHeat.count(request.shooter, request.layout, request.games, request.seed, request.firstGame)

    /**
     * Measures a part of a cell the way the arena measures the whole cell: the same fleets, and a shooter built
     * with the seed of the run.
     *
     * @throws IllegalArgumentException if there is no such shooter or source, or the games are out of range
     */
    fun cellChunk(request: CellChunkRequest): CellChunk {
        RunPart.check(request.firstGame, request.games)
        val range = ShootingRange(layoutSource(request.layout), request.games, request.seed, request.firstGame)
        val shooter = factories.of(request.shooter, against = request.layout, studySeed = request.seed)
        val histogram = IntArray(SHOT_COUNTS)
        range.shotsToSink(shooter).forEach { histogram[it]++ }
        return CellChunk(histogram.asList())
    }

    /**
     * @throws IllegalArgumentException if the histogram holds fewer than two games or is not one of shot counts
     */
    fun measurement(request: MeasurementRequest): Measurement =
        Measurement.ofHistogram(request.shooter, request.layout, request.histogram)
}
