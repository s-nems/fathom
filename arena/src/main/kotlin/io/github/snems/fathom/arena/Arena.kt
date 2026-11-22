package io.github.snems.fathom.arena

import io.github.snems.fathom.app.logToStandardOutput
import io.github.snems.fathom.arena.layouts.FileLayouts
import io.github.snems.fathom.arena.layouts.LayoutFile
import io.github.snems.fathom.arena.layouts.LayoutKind
import io.github.snems.fathom.arena.layouts.draw
import io.github.snems.fathom.arena.shooters.ShooterKind
import io.github.snems.fathom.bot.FathomBot
import java.lang.System.Logger.Level
import java.nio.file.Files
import java.nio.file.Path
import java.util.Locale

private val log = System.getLogger("arena")
private const val DEFAULT_GAMES = 1_000
private const val DEFAULT_SEED = 1L
private const val DEFAULT_TIMED_GAMES = 3
private const val TIME = "time"
private const val LAYOUTS = "layouts"
private const val SHOTS = "shots"
private const val SHOTS_SUFFIX = ".shots"
private const val LABEL_WIDTH = 20
private const val CELL_WIDTH = 20
private const val PERCENT = 100
private const val LAYOUTS_USAGE = "layouts <source> <games> <seed> <file>"
private val LAYOUTS_ARGUMENTS = LAYOUTS_USAGE.split(" ").size
private const val SHOTS_USAGE = "shots <file>"

/**
 * Without arguments prints the shot table for 1000 games and seed 1. Arguments:
 * - `<games> <seed>` for the shot table,
 * - `time <games>` for the longest calls of the bot,
 * - `layouts <source> <games> <seed> <file>` to write fleets of a layout source to a file,
 * - `shots <file>` to shoot at the fleets of a file.
 *
 * @throws IllegalArgumentException if an argument is missing or is not what its place asks for
 */
fun main(args: Array<String>) {
    logToStandardOutput()
    when (args.firstOrNull()) {
        TIME -> {
            val games = args.getOrNull(1)?.toInt() ?: DEFAULT_TIMED_GAMES
            printMoveTimes({ random -> FathomBot(random) }, games, DEFAULT_SEED)
        }

        LAYOUTS -> {
            require(args.size == LAYOUTS_ARGUMENTS) { "Usage: $LAYOUTS_USAGE" }
            val (source, games, seed, file) = args.drop(1)
            LayoutFile.write(Path.of(file), LayoutKind.labelled(source).source.draw(games.toInt(), seed.toLong()))
        }

        SHOTS -> {
            printShotsAt(Path.of(requireNotNull(args.getOrNull(1)) { "Usage: $SHOTS_USAGE" }))
        }

        else -> {
            printShotTable(args.getOrNull(0)?.toInt() ?: DEFAULT_GAMES, args.getOrNull(1)?.toLong() ?: DEFAULT_SEED)
        }
    }
}

/**
 * Prints the mean shots each shooter needs to sink the fleets of a file, each fleet once, and writes the shots
 * of the bot, fleet by fleet, next to the file. The informed shooter counts placements in the same file, so a
 * small file flatters it.
 */
private fun printShotsAt(file: Path) {
    val fleets = LayoutFile.read(file)
    val range = ShootingRange(fleets.map(ShootingRange::fleetOf), DEFAULT_SEED)
    log.log(Level.INFO, "Mean shots to sink the fleet, 95% interval, ${fleets.size} fleets of $file")
    ShooterKind.entries.forEach { shooter ->
        val shots = range.shotsToSink(shooter.against(FileLayouts(fleets), DEFAULT_SEED))
        log.log(Level.INFO, row(shooter.label, listOf(shots.estimate().formatted())))
        if (shooter == ShooterKind.FATHOM) Files.write(Path.of("$file$SHOTS_SUFFIX"), shots.map(Int::toString))
    }
}

/**
 * Prints the mean shots each shooter needs to sink the fleets of each layout source, then the share of games the
 * bot would win against each shooter.
 */
private fun printShotTable(
    games: Int,
    seed: Long,
) {
    val layouts = LayoutKind.entries
    val ranges = layouts.associateWith { ShootingRange(it.source, games, seed) }
    val shots =
        ShooterKind.entries.associateWith { shooter ->
            layouts.associateWith { ranges.getValue(it).shotsToSink(shooter.against(it.source, seed)) }
        }

    log.log(Level.INFO, "Mean shots to sink the fleet, 95% interval, $games games per cell, seed $seed")
    log.log(Level.INFO, row("shooter \\ layouts", layouts.map { it.label }))
    shots.forEach { (shooter, byLayout) ->
        log.log(Level.INFO, row(shooter.label, byLayout.values.map { it.estimate().formatted() }))
    }

    val bot = ShooterKind.FATHOM
    val opponentLayouts = LayoutKind.SEQUENTIAL
    log.log(Level.INFO, "")
    log.log(
        Level.INFO,
        "Share of games ${bot.label} wins when the opponent places ${opponentLayouts.label} fleets and shoots as",
    )
    val own = shots.getValue(bot).getValue(opponentLayouts)
    (shots - bot).forEach { (shooter, byLayout) ->
        val share = winProbability(mine = own, theirs = byLayout.getValue(LayoutKind.FATHOM))
        log.log(Level.INFO, row(shooter.label, listOf("%.1f%%".format(Locale.ROOT, share * PERCENT))))
    }
}

private fun row(
    label: String,
    cells: Collection<String>,
) = label.padEnd(LABEL_WIDTH) + cells.joinToString("") { it.padStart(CELL_WIDTH) }
