package io.github.snems.fathom.engine.catalogue

/**
 * What tells one built shooter from another: its name, the layout source it is to meet and the seed of the
 * layouts it studied.
 */
internal data class ShooterOrder(
    val shooter: String,
    val against: String,
    val studySeed: Long,
)
