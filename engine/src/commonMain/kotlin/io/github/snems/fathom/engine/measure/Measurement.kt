package io.github.snems.fathom.engine.measure

import io.github.snems.fathom.arena.Estimate
import io.github.snems.fathom.arena.estimate
import io.github.snems.fathom.engine.board.CELLS
import io.github.snems.fathom.engine.board.SHOT_COUNTS
import kotlinx.serialization.Serializable

/**
 * Shots one shooter needed against the fleets of one layout source.
 */
@Serializable
internal data class Measurement(
    val shooter: String,
    val layout: String,
    val mean: Double,
    /**
     * Half the width of the 95% confidence interval of the mean.
     */
    val margin: Double,
    /**
     * Games by the number of shots they took, from 0 shots to a shot at every cell.
     */
    val histogram: List<Int>,
) {
    companion object {
        /**
         * The measurement of games that took these numbers of [shots].
         */
        fun of(
            shooter: String,
            layout: String,
            shots: IntArray,
        ): Measurement {
            val estimate = shots.estimate()
            val histogram = IntArray(SHOT_COUNTS)
            shots.forEach { histogram[it]++ }
            return Measurement(shooter, layout, estimate.mean, estimate.margin, histogram.asList())
        }

        /**
         * The measurement of the games counted in a [histogram], however many they are.
         *
         * @throws IllegalArgumentException if the histogram is not one of shot counts or holds fewer than two games
         */
        fun ofHistogram(
            shooter: String,
            layout: String,
            histogram: List<Int>,
        ): Measurement {
            require(histogram.size == SHOT_COUNTS) { "A histogram counts games for 0 to $CELLS shots" }
            val estimate = Estimate.ofCounts(histogram)
            return Measurement(shooter, layout, estimate.mean, estimate.margin, histogram)
        }
    }
}
