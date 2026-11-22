package io.github.snems.fathom.bot

import kotlin.time.Duration
import kotlin.time.TimeMark
import kotlin.time.TimeSource

/**
 * How long the bot may improve one answer. It matters on a cold or slow JVM, where an answer must still stay
 * well under the limit of the referee.
 */
internal class TimeBudget(
    private val duration: Duration,
    private val timeSource: TimeSource,
) {
    /** Starts the time for one answer and returns the moment it is up. */
    fun start(): TimeMark = timeSource.markNow() + duration
}
