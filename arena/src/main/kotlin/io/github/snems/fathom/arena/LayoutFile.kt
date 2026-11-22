package io.github.snems.fathom.arena

import jd.mg.ships.tournament.api.Direction
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement
import java.nio.file.Files
import java.nio.file.Path
import kotlin.random.Random

/**
 * Fleets as text, one per line, each ship as its size, `h` or `v`, x and y, such as `5h23`. The neural
 * experiment reads and writes the same format, so fleets can pass between the two programs.
 */
object LayoutFile {
    fun write(
        path: Path,
        layouts: List<List<ShipPlacement>>,
    ) {
        Files.write(path, layouts.map { ships -> ships.joinToString(" ", transform = ::text) })
    }

    fun read(path: Path): List<List<ShipPlacement>> =
        Files.readAllLines(path).filter { it.isNotBlank() }.map { line -> line.split(" ").map(::ship) }

    private fun text(ship: ShipPlacement): String =
        "${ship.size}${LETTERS.getValue(ship.direction)}${ship.position.x}${ship.position.y}"

    private fun ship(text: String): ShipPlacement {
        val (size, letter, x, y) = text.toList()
        val direction = LETTERS.entries.first { it.value == letter }.key
        return ShipPlacement(size.digitToInt(), Position(x.digitToInt(), y.digitToInt()), direction)
    }

    private val LETTERS = mapOf(Direction.HORIZONTAL to 'h', Direction.VERTICAL to 'v')
}

/** The fleets of a file, picked at random. */
class FileLayouts(
    private val layouts: List<List<ShipPlacement>>,
) : LayoutSource {
    override fun layout(random: Random): List<ShipPlacement> = layouts.random(random)
}
