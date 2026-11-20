package io.github.snems.fathom.bot

import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import kotlin.random.Random

/**
 * What the bot believes about how the opponent laid out its fleet. With the chance [sequentialChance] the
 * opponent placed ship after ship, largest first, each at random among the placements still free, which crowds
 * the later, smaller ships into what is left. Otherwise any legal fleet is as likely as any other.
 */
internal class PlacingBelief(
    private val sequentialChance: Double,
    private val random: Random,
) {
    private val order = ArrayList<Candidate>(FLEET_SHIP_SIZES.size)
    private val taken = CellSet()

    /**
     * How likely the fleet is under this belief, compared with picking any legal fleet with equal chance. The
     * fleet is given as the ships already sunk and the ships assumed afloat. The answer is a random estimate
     * that is right on average, which is all that sampling needs.
     */
    fun weightOf(
        sunk: List<Candidate>,
        afloat: List<Candidate>,
    ): Double {
        if (sequentialChance == 0.0) return 1.0
        val sequential = LEGAL_FLEETS * ORDERS * sequentialChanceInOneOrder(sunk, afloat)
        return sequentialChance * sequential + (1.0 - sequentialChance)
    }

    /**
     * The chance that placing ship after ship produces exactly these ships in one order, with ships of equal
     * size in a random order. The chance of the fleet is the sum over all [ORDERS] orders, so one order drawn at
     * random, times their number, is right on average.
     */
    private fun sequentialChanceInOneOrder(
        sunk: List<Candidate>,
        afloat: List<Candidate>,
    ): Double {
        order.clear()
        order.addAll(sunk)
        order.addAll(afloat)
        order.shuffle(random)
        taken.clear()
        var chance = 1.0
        for (size in Placements.SIZES) {
            for (index in order.indices) {
                val ship = order[index]
                if (ship.cells.size != size) continue
                chance /= Placements.ALL[size].countFreeOf(taken)
                taken.add(ship.claim)
            }
        }
        return chance
    }

    companion object {
        /**
         * Number of legal fleets on the board. Estimated with [FleetSampler] itself: on an empty board the mean
         * weight of a drawn fleet is this number. A test repeats the estimate.
         */
        const val LEGAL_FLEETS = 2.95e14

        /** Orders in which the ships of a fleet can be placed largest first: ships of equal size swap freely. */
        val ORDERS: Double =
            FLEET_SHIP_SIZES
                .groupingBy { it }
                .eachCount()
                .values
                .fold(1.0) { orders, ships -> orders * (1..ships).fold(1.0) { product, factor -> product * factor } }
    }
}
