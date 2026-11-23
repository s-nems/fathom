package io.github.snems.fathom.engine.measure

import kotlinx.serialization.Serializable

/**
 * Asks for the mean and its interval of a cell whose parts have been added up into one [histogram].
 */
@Serializable
internal data class MeasurementRequest(
    val shooter: String,
    val layout: String,
    val histogram: List<Int>,
)
