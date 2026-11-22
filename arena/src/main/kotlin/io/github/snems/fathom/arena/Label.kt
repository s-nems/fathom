package io.github.snems.fathom.arena

/**
 * The name in tables and requests: `FATHOM_NO_EDGE` reads `fathom-no-edge`.
 */
internal fun labelOf(kind: Enum<*>): String = kind.name.lowercase().replace('_', '-')
