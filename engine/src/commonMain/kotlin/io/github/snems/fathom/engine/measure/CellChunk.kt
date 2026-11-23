package io.github.snems.fathom.engine.measure

import kotlinx.serialization.Serializable

/**
 * The games of a part of a cell by the number of shots they took, from 0 shots to a shot at every cell. The
 * histograms of the parts add up to the histogram of the cell.
 */
@Serializable
internal data class CellChunk(
    val histogram: List<Int>,
)
