package io.github.snems.fathom.app

import java.lang.System.Logger
import java.lang.System.Logger.Level.INFO
import java.util.logging.LogManager
import java.util.logging.LogRecord
import java.util.logging.SimpleFormatter
import java.util.logging.StreamHandler

private const val FORMAT_PROPERTY = "java.util.logging.SimpleFormatter.format"

/**
 * Time, level, logger name and message on one line, then the stack trace if there is one.
 */
private const val FORMAT = "%1\$tT.%1\$tL %4\$-7s %3\$s: %5\$s%6\$s%n"

/**
 * Sends everything a program logs through the system logger to standard output, an entry per line and at once.
 * Called first thing in `main`, before anything is logged.
 */
fun logToStandardOutput() {
    System.setProperty(FORMAT_PROPERTY, FORMAT)
    val root = LogManager.getLogManager().getLogger("")
    root.handlers.forEach(root::removeHandler)
    root.addHandler(FlushingHandler())
}

/**
 * Logs a message at the level most of what a program says has.
 */
fun Logger.info(message: String) = log(INFO, message)

/**
 * Writes each entry out as soon as it is logged, where a plain stream handler would wait for its buffer to fill.
 */
private class FlushingHandler : StreamHandler(System.out, SimpleFormatter()) {
    override fun publish(entry: LogRecord?) {
        super.publish(entry)
        flush()
    }
}
