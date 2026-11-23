package io.github.snems.fathom.engine.catalogue

import io.github.snems.fathom.arena.layouts.LayoutKind
import io.github.snems.fathom.arena.layouts.LayoutSource
import io.github.snems.fathom.engine.board.Ship
import kotlin.random.Random

/**
 * @throws IllegalArgumentException if the catalogue has no layout source of that name
 */
internal fun layoutSource(name: String): LayoutSource = LayoutKind.labelled(name).source

/**
 * One fleet of the layout source of that name.
 *
 * @throws IllegalArgumentException if the catalogue has no layout source of that name
 */
internal fun fleetOf(
    source: String,
    seed: Long,
): List<Ship> = layoutSource(source).layout(Random(seed)).map(Ship::of)
