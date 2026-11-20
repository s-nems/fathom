package io.github.snems.fathom.arena

import io.github.snems.fathom.bot.FathomBot
import io.github.snems.fathom.bot.LayoutPolicy
import io.github.snems.fathom.bot.SamplerSettings
import java.nio.file.Files
import java.nio.file.Path
import java.util.Locale
import kotlin.random.Random
import kotlin.time.Duration

private const val DEFAULT_GAMES = 1_000
private const val DEFAULT_SEED = 1L
private const val DEFAULT_TIMED_GAMES = 3
private const val TIME = "time"
private const val LAYOUTS = "layouts"
private const val SHOTS = "shots"
private const val SHOTS_SUFFIX = ".shots"
private const val FREQUENCY_LAYOUTS = 10_000
private const val LABEL_WIDTH = 20
private const val CELL_WIDTH = 20
private const val PERCENT = 100

/** The bot under test, as a shooter and as a layout source. */
private const val FATHOM = "fathom"

/** Fleets placed ship by ship at random, the way a simple opponent places them. */
private const val SEQUENTIAL = "sequential"

/** A density shooter that has seen many layouts of the source it shoots at. */
private const val INFORMED = "density-informed"

private val layouts: Map<String, LayoutSource> =
    linkedMapOf(
        SEQUENTIAL to SequentialLayouts(shuffled = false),
        "shuffled" to SequentialLayouts(shuffled = true),
        FATHOM to BotLayouts { random -> fathom(random) },
        "fathom-no-edge" to BotLayouts { random -> fathom(random, LayoutPolicy(edgeChance = 0.0)) },
        "fathom-first-draft" to BotLayouts { random -> fathom(random, LayoutPolicy(drafts = 1)) },
    )

/** Shooters by name. Each is built for the layout source it will shoot at, which only the informed one uses. */
private fun shooters(seed: Long): Map<String, (LayoutSource) -> (Random) -> Shooter> =
    linkedMapOf(
        "random" to { _ -> { random -> RandomShooter(random) } },
        "hunt-target" to { _ -> { random -> HuntTargetShooter(random, parity = false) } },
        "hunt-target-parity" to { _ -> { random -> HuntTargetShooter(random, parity = true) } },
        "density" to { _ -> { random -> DensityShooter(random) } },
        INFORMED to { source ->
            val frequencies = PlacementFrequencies(source, FREQUENCY_LAYOUTS, seed)
            return@to { random -> DensityShooter(random, frequencies::weightOf) }
        },
        FATHOM to { _ -> { random -> fathom(random).asShooter() } },
        "fathom-sequential" to
            { _ -> { random -> fathom(random, sampler = SamplerSettings(sequentialChance = 1.0)).asShooter() } },
        "fathom-any-fleet" to
            { _ -> { random -> fathom(random, sampler = SamplerSettings(sequentialChance = 0.0)).asShooter() } },
        "fathom-no-sampling" to
            { _ -> { random -> fathom(random, sampler = SamplerSettings(samples = 0)).asShooter() } },
    )

/** The bot without a time budget, so that a table does not depend on how fast the machine is. */
private fun fathom(
    random: Random,
    layout: LayoutPolicy = LayoutPolicy(),
    sampler: SamplerSettings = SamplerSettings(),
) = FathomBot(random, layout, sampler, timeBudget = Duration.INFINITE)

/**
 * Without arguments prints the shot table for 1000 games and seed 1. Arguments:
 * - `<games> <seed>` for the shot table,
 * - `time <games>` for the longest calls of the bot,
 * - `layouts <source> <games> <seed> <file>` to write fleets of a layout source to a file,
 * - `shots <file>` to shoot at the fleets of a file.
 */
fun main(args: Array<String>) {
    when (args.firstOrNull()) {
        TIME -> {
            val games = args.getOrNull(1)?.toInt() ?: DEFAULT_TIMED_GAMES
            printMoveTimes({ random -> FathomBot(random) }, games, DEFAULT_SEED)
        }

        LAYOUTS -> {
            val (source, games, seed, file) = args.drop(1)
            LayoutFile.write(Path.of(file), layouts.getValue(source).layouts(games.toInt(), seed.toLong()))
        }

        SHOTS -> {
            printShotsAt(Path.of(args[1]))
        }

        else -> {
            printShotTable(args.getOrNull(0)?.toInt() ?: DEFAULT_GAMES, args.getOrNull(1)?.toLong() ?: DEFAULT_SEED)
        }
    }
}

/**
 * Prints the mean shots each shooter needs to sink the fleets of a file, each fleet once, and writes the shots
 * of the bot, fleet by fleet, next to the file.
 */
private fun printShotsAt(file: Path) {
    val fleets = LayoutFile.read(file)
    val range = ShootingRange(fleets.map(ShootingRange::fleetOf), DEFAULT_SEED)
    println("Mean shots to sink the fleet, 95% interval, ${fleets.size} fleets of $file")
    shooters(DEFAULT_SEED).forEach { (name, shooter) ->
        val shots = range.shotsToSink(shooter(FileLayouts(fleets)))
        println(row(name, listOf(shots.estimate().toString())))
        if (name == FATHOM) Files.write(Path.of("$file$SHOTS_SUFFIX"), shots.map(Int::toString))
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
    val ranges = layouts.mapValues { (_, source) -> ShootingRange(source, games, seed) }
    val shots =
        shooters(seed).mapValues { (_, shooter) ->
            layouts.mapValues { (layout, source) -> ranges.getValue(layout).shotsToSink(shooter(source)) }
        }

    println("Mean shots to sink the fleet, 95% interval, $games games per cell, seed $seed")
    println(row("shooter \\ layouts", layouts.keys))
    shots.forEach { (shooter, byLayout) -> println(row(shooter, byLayout.values.map { it.estimate().toString() })) }

    println()
    println("Share of games $FATHOM wins when the opponent places $SEQUENTIAL fleets and shoots as")
    val own = shots.getValue(FATHOM).getValue(SEQUENTIAL)
    (shots - FATHOM).forEach { (shooter, byLayout) ->
        val share = winProbability(mine = own, theirs = byLayout.getValue(FATHOM))
        println(row(shooter, listOf("%.1f%%".format(Locale.ROOT, share * PERCENT))))
    }
}

private fun row(
    label: String,
    cells: Collection<String>,
) = label.padEnd(LABEL_WIDTH) + cells.joinToString("") { it.padStart(CELL_WIDTH) }
