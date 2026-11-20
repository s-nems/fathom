package io.github.snems.fathom.arena

import io.github.snems.fathom.bot.FathomBot
import io.github.snems.fathom.bot.LayoutPolicy
import java.util.Locale
import kotlin.random.Random

private const val DEFAULT_GAMES = 1_000
private const val DEFAULT_SEED = 1L
private const val FREQUENCY_LAYOUTS = 10_000
private const val LABEL_WIDTH = 20
private const val CELL_WIDTH = 20

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
        FATHOM to BotLayouts { random -> FathomBot(random) },
        "fathom-no-edge" to BotLayouts { random -> FathomBot(random, LayoutPolicy(edgeChance = 0.0)) },
        "fathom-first-draft" to BotLayouts { random -> FathomBot(random, LayoutPolicy(drafts = 1)) },
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
        FATHOM to { _ -> { random -> FathomBot(random).asShooter() } },
    )

/**
 * Prints the mean shots each shooter needs to sink the fleets of each layout source, then the share of games the
 * bot would win against each shooter. Arguments: number of games (default 1000), seed (default 1).
 */
fun main(args: Array<String>) {
    val games = args.getOrNull(0)?.toInt() ?: DEFAULT_GAMES
    val seed = args.getOrNull(1)?.toLong() ?: DEFAULT_SEED
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

private const val PERCENT = 100

private fun row(
    label: String,
    cells: Collection<String>,
) = label.padEnd(LABEL_WIDTH) + cells.joinToString("") { it.padStart(CELL_WIDTH) }
