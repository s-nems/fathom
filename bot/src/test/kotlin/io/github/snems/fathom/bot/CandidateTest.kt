package io.github.snems.fathom.bot

import io.github.snems.fathom.SampleFleets.ship
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.types.shouldBeSameInstanceAs
import jd.mg.ships.tournament.api.Direction.HORIZONTAL
import org.junit.jupiter.api.Test

class CandidateTest {
    @Test
    fun shouldHandOutTheSameCandidateForAShipOfTheFleet() {
        // when
        val candidate = Candidate.of(ship(3, 2, 2, HORIZONTAL))

        // then
        candidate shouldBeSameInstanceAs Candidate.of(ship(3, 2, 2, HORIZONTAL))
    }

    @Test
    fun shouldRefuseAShipOffTheBoard() {
        // then
        shouldThrow<IllegalArgumentException> { Candidate.of(ship(3, 8, 2, HORIZONTAL)) }
    }
}
