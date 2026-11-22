package io.github.snems.fathom.arena

import java.util.Locale

/**
 * The estimate as a cell of a table: the mean and the half width of its interval, to two decimals.
 */
internal fun Estimate.formatted(): String = "%.2f ± %.2f".format(Locale.ROOT, mean, margin)
