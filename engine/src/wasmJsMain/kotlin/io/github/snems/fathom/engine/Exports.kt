@file:OptIn(ExperimentalJsExport::class)

package io.github.snems.fathom.engine

import kotlin.js.ExperimentalJsExport
import kotlin.js.JsExport
import kotlin.time.TimeSource

/**
 * The engine of this module instance. A page has one instance on each of its workers.
 */
private val engine = JsonEngine(TimeSource.Monotonic)

/**
 * The layout sources and shooters to choose from, and the size of the game.
 */
@JsExport
fun catalogue(): String = engine.catalogue()

/**
 * Plays a whole game between two sides of the catalogue.
 */
@JsExport
fun playGame(request: String): String = engine.playGame(request)

/**
 * Plays the game of a human up to the next shot the human owes.
 */
@JsExport
fun playHumanGame(request: String): String = engine.playHumanGame(request)

/**
 * Reads the text of a game log into the record of its game.
 */
@JsExport
fun readLog(
    title: String,
    text: String,
): String = engine.readLog(title, text)

/**
 * Counts where a layout source places its ships.
 */
@JsExport
fun layoutHeat(request: String): String = engine.layoutHeat(request)

/**
 * Draws one fleet of a layout source.
 */
@JsExport
fun drawLayout(request: String): String = engine.drawLayout(request)

/**
 * Counts where a shooter shoots, shot number by shot number, in a part of a run.
 */
@JsExport
fun shooterHeat(request: String): String = engine.shooterHeat(request)

/**
 * Measures a part of one cell of an arena table.
 */
@JsExport
fun cellChunk(request: String): String = engine.cellChunk(request)

/**
 * Works out the mean and its interval of a cell from the histogram of all its parts.
 */
@JsExport
fun measurement(request: String): String = engine.measurement(request)
