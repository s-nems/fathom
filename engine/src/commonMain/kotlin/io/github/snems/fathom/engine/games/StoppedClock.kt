package io.github.snems.fathom.engine.games

import kotlin.time.Duration
import kotlin.time.TimeMark
import kotlin.time.TimeSource

/**
 * A clock that never moves, for a referee that holds nobody to the time limit.
 */
internal object StoppedClock : TimeSource {
    override fun markNow(): TimeMark = Mark

    private object Mark : TimeMark {
        override fun elapsedNow(): Duration = Duration.ZERO
    }
}
