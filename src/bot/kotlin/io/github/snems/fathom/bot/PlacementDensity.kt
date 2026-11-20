package io.github.snems.fathom.bot

/**
 * Weighs a cell by the number of placements of the ships afloat that pass over it, each ship counted on its
 * own. While a hit is open, only placements through a hit count, so the bot finishes the ship it has found.
 * Cheap and never empty while a ship can still be somewhere.
 */
internal class PlacementDensity(
    private val waters: EnemyWaters,
) : ShotWeights {
    override fun weights(): DoubleArray {
        val throughHits = count(throughHitsOnly = waters.hasOpenHits)
        // Results that fit no legal fleet can leave nothing through the hits. Then every placement counts.
        return if (throughHits.any { it > 0.0 }) throughHits else count(throughHitsOnly = false)
    }

    private fun count(throughHitsOnly: Boolean): DoubleArray {
        val weights = DoubleArray(CELL_COUNT)
        for (size in waters.afloat) {
            for (candidate in Candidate.BY_SIZE.getValue(size)) {
                if (!waters.allows(candidate)) continue
                if (throughHitsOnly && !waters.passesThroughHit(candidate)) continue
                candidate.cells.forEach { if (!waters.isOpenHit(it)) weights[it]++ }
            }
        }
        return weights
    }
}
