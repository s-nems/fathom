package io.github.snems.fathom.engine.heat

import io.github.snems.fathom.engine.board.Ship
import kotlinx.serialization.Serializable

/**
 * How often a layout source covers each cell, counted over [count] of its fleets.
 */
@Serializable
internal data class LayoutHeat(
    val source: String,
    val count: Int,
    val cells: List<Int>,
    val bySize: Map<Int, List<Int>>,
    val samples: List<List<Ship>>,
)
