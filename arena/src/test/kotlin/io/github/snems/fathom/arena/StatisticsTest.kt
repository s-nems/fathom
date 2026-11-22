package io.github.snems.fathom.arena

import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.doubles.plusOrMinus
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.Test

class StatisticsTest {
    @Test
    fun shouldEstimateTheMeanWithItsInterval() {
        // when
        val estimate = intArrayOf(48, 50, 52, 50).estimate()

        // then: the deviation of the sample is the root of 8/3, and the margin is 1.96 of it over the root of 4
        estimate.mean shouldBe 50.0
        estimate.margin shouldBe (1.6003 plusOrMinus ROUNDING)
        estimate.formatted() shouldBe "50.00 ± 1.60"
    }

    @Test
    fun shouldRefuseAnIntervalFromOneValue() {
        // when, then
        shouldThrow<IllegalArgumentException> { intArrayOf(50).estimate() }
    }

    @Test
    fun shouldCountAGameWithFewerShotsAsWonAndATieAsHalf() {
        // given
        val mine = intArrayOf(40, 50)
        val theirs = intArrayOf(50, 60)

        // when
        val share = winProbability(mine, theirs)

        // then: 40 beats both, 50 ties with 50 and beats 60
        share shouldBe (1 + 1 + 0.5 + 1) / 4
    }

    @Test
    fun shouldGiveEqualPlayersHalfTheGames() {
        // given
        val shots = intArrayOf(44, 47, 47, 51, 60)

        // when, then
        winProbability(shots, shots) shouldBe (0.5 plusOrMinus ROUNDING)
    }

    private companion object {
        const val ROUNDING = 0.0001
    }
}
