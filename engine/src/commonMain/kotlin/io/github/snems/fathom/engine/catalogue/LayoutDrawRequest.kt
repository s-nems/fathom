package io.github.snems.fathom.engine.catalogue

import kotlinx.serialization.Serializable

/**
 * Asks for one fleet of a layout source.
 */
@Serializable
internal data class LayoutDrawRequest(
    val source: String,
    val seed: Long,
)
