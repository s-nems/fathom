package io.github.snems.fathom.engine.heat

import kotlinx.serialization.Serializable

/**
 * Asks where a layout source places its ships, counted over [count] fleets.
 */
@Serializable
internal data class LayoutHeatRequest(
    val source: String,
    val count: Int,
    val seed: Long,
)
