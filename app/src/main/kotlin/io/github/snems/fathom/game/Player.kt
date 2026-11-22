package io.github.snems.fathom.game

/**
 * One of the two sides of a game.
 */
enum class Player {
    ONE,
    TWO,
    ;

    val opponent: Player get() = if (this == ONE) TWO else ONE
}
