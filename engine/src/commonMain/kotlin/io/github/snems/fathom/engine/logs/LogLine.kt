package io.github.snems.fathom.engine.logs

import io.github.snems.fathom.engine.board.Ship
import io.github.snems.fathom.game.Player
import jd.mg.ships.tournament.api.Direction
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShotResult

/**
 * One line of a game log: a time of day, the kind of the event and its details.
 *
 * @throws IllegalArgumentException if the text is not a line of a game log
 */
internal class LogLine(
    private val text: String,
) {
    val time: String
    private val kind: String
    private val details: String

    init {
        val (time, kind, details) = requireNotNull(LINE.matchEntire(text)) { refusal() }.destructured
        require(kind in KINDS) { refusal() }
        this.time = time
        this.kind = kind
        this.details = details
    }

    /**
     * The player whose ship the line places, or null when it places none.
     */
    val owner: Player? get() = OWNERS[kind]

    /**
     * The player whose shot the line reports, or null when it reports none.
     */
    val shooter: Player? get() = SHOOTERS[kind]

    val endsGame: Boolean get() = kind == GAME_OVER

    fun ship(): Ship {
        val (size, x, y, direction) = find(SHIP)
        return Ship(size.toInt(), x.toInt(), y.toInt(), Direction.valueOf(direction.uppercase()))
    }

    fun position(): Position {
        val (x, y) = find(POSITION)
        return Position(x.toInt(), y.toInt())
    }

    fun result(): ShotResult = ShotResult.valueOf(find(RESULT).component1().uppercase())

    fun winner(): Player = if (find(RESULT).component1() == WIN) Player.ONE else Player.TWO

    fun totalShots(): Map<Player, Int> {
        val (own, enemy) = find(TOTALS)
        return mapOf(Player.ONE to own.toInt(), Player.TWO to enemy.toInt())
    }

    private fun find(pattern: Regex): MatchResult.Destructured =
        requireNotNull(pattern.find(details)) { refusal() }.destructured

    private fun refusal() = "Not a line of a game log: $text"

    private companion object {
        const val OWN_SHIP = "place-ship"
        const val ENEMY_SHIP = "enemy-ship"
        const val OWN_SHOT = "shot"
        const val ENEMY_SHOT = "enemy-shot"
        const val GAME_OVER = "game-over"
        const val WIN = "win"
        val OWNERS = mapOf(OWN_SHIP to Player.ONE, ENEMY_SHIP to Player.TWO)
        val SHOOTERS = mapOf(OWN_SHOT to Player.ONE, ENEMY_SHOT to Player.TWO)
        val KINDS = OWNERS.keys + SHOOTERS.keys + GAME_OVER
        val LINE = Regex("""(\d\d:\d\d:\d\d\.\d{3}) ([a-z-]+): (.*)""")
        val POSITION = Regex("""pos=\((\d+),(\d+)\)""")
        val SHIP = Regex("""size=(\d+) pos=\((\d+),(\d+)\) dir=([a-z]+)""")
        val RESULT = Regex("""result=([a-z]+)""")
        val TOTALS = Regex("""total-shots=(\d+) enemy-total-shots=(\d+)""")
    }
}
