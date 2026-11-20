package io.github.snems.fathom.bot

import kotlin.random.Random

/** How the bot samples the fleets the opponent may have. */
internal class SamplerSettings(
    /** Fleets drawn for one shot. */
    val samples: Int = 2_000,
    /**
     * The chance the bot gives to the opponent having placed ship after ship at random. See [PlacingBelief].
     * Of the values measured, an even chance costs the least on the kind of layout it suits worst.
     */
    val sequentialChance: Double = 0.5,
)

/**
 * Weighs a cell by how often it is occupied in random whole fleets that agree with every shot so far. Unlike
 * counting each ship on its own, a whole fleet respects that ships keep each other at a distance.
 *
 * A fleet is drawn ship by ship: first a ship through every open hit that no earlier ship covers, then the
 * remaining sizes, largest first, each at random among the placements still free. That does not produce every
 * fleet equally often, so a fleet counts with a weight that undoes it: the number of choices at each step,
 * divided for each size by the number of orders in which its ships of the second step could have come up. The
 * weight is then multiplied by how likely the opponent is to have placed such a fleet.
 */
internal class FleetSampler(
    private val waters: EnemyWaters,
    private val random: Random,
    private val settings: SamplerSettings,
    private val timeBudget: TimeBudget,
) : ShotWeights {
    private val belief = PlacingBelief(settings.sequentialChance, random)

    override fun weights(): DoubleArray {
        val deadline = timeBudget.start()
        val draw = Draw()
        val weights = DoubleArray(CELL_COUNT)
        var drawn = 0
        while (drawn < settings.samples && deadline.hasNotPassedNow()) {
            val weight = draw.nextFleet()
            if (weight > 0.0) draw.ships.forEach { ship -> ship.cells.forEach { weights[it] += weight } }
            drawn++
        }
        waters.openHits().forEach { weights[it] = 0.0 }
        return weights
    }

    /** Draws one fleet after another for the same shot, into the same buffers. */
    private inner class Draw {
        private val hits: IntArray = waters.openHits()

        /** Ship sizes afloat, largest first, each once. */
        private val sizes: IntArray = waters.afloat.distinct().toIntArray()

        /** Number of ships afloat by size. */
        private val shipsAfloat =
            IntArray(Placements.LENGTH_BY_SIZE).also { count ->
                waters.afloat.forEach { count[it]++ }
            }

        /**
         * By ship size, the placements a ship afloat may take that pass through no hit. By the time they are
         * used a ship covers every hit, so leaving these out only shortens the scan.
         */
        private val offHits: Array<Placements> =
            Placements.bySize { size ->
                Candidate.BY_SIZE.getValue(size).filter { waters.allows(it) && !waters.passesThroughHit(it) }
            }

        /** By hit, then by ship size, the placements through that hit that leave some cell of the ship unhit. */
        private val throughHit: List<Array<Placements>> =
            hits.map { hit ->
                Placements.bySize { size ->
                    Candidate.BY_SIZE.getValue(size).filter { candidate ->
                        hit in candidate.cells && waters.allows(candidate) && !candidate.cells.all(waters::isOpenHit)
                    }
                }
            }

        /** The ships of the fleet drawn last. */
        val ships = ArrayList<Candidate>(waters.afloat.size)

        private val toDraw = IntArray(shipsAfloat.size)
        private val covered = CellSet()
        private val claimed = CellSet()

        /** The placements to choose from at one step, and for a ship through a hit also the size of each. */
        private val free = IntArray(Placements.MOST_OF_A_SIZE * Placements.SIZES.size)
        private val freeSize = IntArray(free.size)

        /** Draws a fleet into [ships] and returns its weight, or 0 when the drawing ran into a dead end. */
        fun nextFleet(): Double {
            ships.clear()
            covered.clear()
            claimed.clear()
            shipsAfloat.copyInto(toDraw)
            var weight = 1.0

            for (index in hits.indices) {
                if (hits[index] in covered) continue
                val choices = placeThrough(throughHit[index])
                if (choices == 0) return 0.0
                weight *= choices
            }
            for (size in sizes) {
                for (nth in 1..toDraw[size]) {
                    val choices = offHits[size].freeOf(claimed, free)
                    if (choices == 0) return 0.0
                    place(offHits[size][free[random.nextInt(choices)]])
                    weight *= choices.toDouble() / nth
                }
            }
            return weight * belief.weightOf(waters.sunk, ships)
        }

        /**
         * Places a ship through an open hit, at random among every size still to draw and every placement of it
         * that is still free. Returns the number of choices there were, or 0 when there was none.
         */
        private fun placeThrough(placements: Array<Placements>): Int {
            var choices = 0
            for (size in sizes) {
                if (toDraw[size] == 0) continue
                val found = placements[size].freeOf(claimed, free, start = choices)
                freeSize.fill(size, choices, choices + found)
                choices += found
            }
            if (choices == 0) return 0
            val chosen = random.nextInt(choices)
            val size = freeSize[chosen]
            place(placements[size][free[chosen]])
            toDraw[size]--
            return choices
        }

        private fun place(ship: Candidate) {
            ships += ship
            covered.add(ship.covered)
            claimed.add(ship.claim)
        }
    }
}
