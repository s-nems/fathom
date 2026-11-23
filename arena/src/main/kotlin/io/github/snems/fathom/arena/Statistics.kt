package io.github.snems.fathom.arena

import kotlin.math.sqrt

private const val DRAW_SHARE = 0.5

/**
 * Mean of a sample with its 95% confidence interval.
 */
class Estimate private constructor(
    size: Long,
    val mean: Double,
    squaredDeviations: Double,
) {
    constructor(values: DoubleArray) : this(values.size.toLong(), values.average(), squaredDeviations(values))

    init {
        require(size > 1) { "An interval needs at least two values" }
    }

    val deviation: Double = sqrt(squaredDeviations / (size - 1))

    /**
     * Half the width of the 95% confidence interval of the mean.
     */
    val margin: Double = NORMAL_95 * deviation / sqrt(size.toDouble())

    companion object {
        private const val NORMAL_95 = 1.96

        /**
         * The estimate of a sample given as a histogram: [counts] holds, for each value from 0 up, how often
         * the sample has it. The sample itself is never spelled out, so its size costs nothing.
         *
         * @throws IllegalArgumentException if a count is negative or the sample has fewer than two values
         */
        fun ofCounts(counts: List<Int>): Estimate {
            require(counts.all { it >= 0 }) { "A histogram counts how often a value occurs" }
            val size = counts.sumOf { it.toLong() }
            val mean = counts.withIndex().sumOf { (value, count) -> value.toDouble() * count } / size
            val squares = counts.withIndex().sumOf { (value, count) -> (value - mean) * (value - mean) * count }
            return Estimate(size, mean, squares)
        }

        private fun squaredDeviations(values: DoubleArray): Double {
            val mean = values.average()
            return values.sumOf { (it - mean) * (it - mean) }
        }
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
