package io.github.snems.fathom.arena

import kotlin.math.sqrt

private const val DRAW_SHARE = 0.5

/**
 * Mean of a sample with its 95% confidence interval.
 */
class Estimate(
    values: DoubleArray,
) {
    init {
        require(values.size > 1) { "An interval needs at least two values" }
    }

    val mean: Double = values.average()
    val deviation: Double = sqrt(values.sumOf { (it - mean) * (it - mean) } / (values.size - 1))

    /**
     * Half the width of the 95% confidence interval of the mean.
     */
    val margin: Double = NORMAL_95 * deviation / sqrt(values.size.toDouble())

    private companion object {
        const val NORMAL_95 = 1.96
    }
}

fun IntArray.estimate(): Estimate = Estimate(DoubleArray(size) { this[it].toDouble() })

/**
 * Chance that a game needing [mine] shots beats an independent game needing [theirs], when the lower count wins
 * and an equal count is decided by a fair draw of who shoots first.
 */
fun winProbability(
    mine: IntArray,
    theirs: IntArray,
): Double {
    val theirCounts = theirs.asList().groupingBy { it }.eachCount()
    val wins =
        mine.sumOf { shots ->
            theirCounts.entries.sumOf { (theirShots, games) ->
                when {
                    shots < theirShots -> games.toDouble()
                    shots == theirShots -> games * DRAW_SHARE
                    else -> 0.0
                }
            }
        }
    return wins / (mine.size.toDouble() * theirs.size)
}
