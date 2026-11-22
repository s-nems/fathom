package io.github.snems.fathom.arena.layouts

import jd.mg.ships.tournament.api.Direction
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement
import java.nio.file.Files
import java.nio.file.Path

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

    /**
     * @throws IllegalArgumentException if a line holds something that is not a ship
     */
    fun read(path: Path): List<List<ShipPlacement>> =
        Files.readAllLines(path).filter { it.isNotBlank() }.map { line -> line.split(" ").map(::ship) }

    private fun text(ship: ShipPlacement): String =
        "${ship.size}${LETTERS.getValue(ship.direction)}${ship.position.x}${ship.position.y}"

    private fun ship(text: String): ShipPlacement {
        require(text.length == SHIP_LENGTH) { "Not a ship: $text" }
        val (size, letter, x, y) = text.toList()
        val direction = requireNotNull(DIRECTIONS[letter]) { "Not a ship: $text" }
        return ShipPlacement(size.digitToInt(), Position(x.digitToInt(), y.digitToInt()), direction)
    }

    /**
     * Characters of a ship: its size, its letter, x and y.
     */
    private const val SHIP_LENGTH = 4
    private val LETTERS = mapOf(Direction.HORIZONTAL to 'h', Direction.VERTICAL to 'v')
    private val DIRECTIONS = LETTERS.entries.associate { (direction, letter) -> letter to direction }
}
