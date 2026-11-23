package io.github.snems.fathom.engine

import io.github.snems.fathom.engine.catalogue.LayoutDrawRequest
import io.github.snems.fathom.engine.games.GameRequest
import io.github.snems.fathom.engine.heat.LayoutHeatRequest
import io.github.snems.fathom.engine.heat.ShooterHeatRequest
import io.github.snems.fathom.engine.measure.CellChunkRequest
import io.github.snems.fathom.engine.measure.MeasurementRequest
import io.github.snems.fathom.engine.play.HumanGameRequest
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.encodeToJsonElement
import kotlin.time.TimeSource

/**
 * The engine for a caller that speaks JSON, which is all that crosses into the browser. Every answer is an
 * object with either a `value` or, when the request could not be answered, an `error` that says why.
 */
internal class JsonEngine(
    timeSource: TimeSource,
) {
    private val engine = Engine(timeSource)

    fun catalogue(): String = answer { json.encodeToJsonElement(engine.catalogue()) }

    fun playGame(request: String): String = answer { json.encodeToJsonElement(engine.play(gameRequest(request))) }

    fun playHumanGame(request: String): String =
        answer { json.encodeToJsonElement(engine.play(json.decodeFromString<HumanGameRequest>(request))) }

    fun readLog(
        title: String,
        text: String,
    ): String = answer { json.encodeToJsonElement(engine.readLog(title, text)) }

    fun layoutHeat(request: String): String =
        answer { json.encodeToJsonElement(engine.layoutHeat(json.decodeFromString<LayoutHeatRequest>(request))) }

    fun drawLayout(request: String): String =
        answer { json.encodeToJsonElement(engine.drawLayout(json.decodeFromString<LayoutDrawRequest>(request))) }

    fun shooterHeat(request: String): String =
        answer { json.encodeToJsonElement(engine.shooterHeat(json.decodeFromString<ShooterHeatRequest>(request))) }

    fun cellChunk(request: String): String =
        answer { json.encodeToJsonElement(engine.cellChunk(json.decodeFromString<CellChunkRequest>(request))) }

    fun measurement(request: String): String =
        answer { json.encodeToJsonElement(engine.measurement(json.decodeFromString<MeasurementRequest>(request))) }

    private fun gameRequest(request: String) = json.decodeFromString<GameRequest>(request)

    /**
     * Nothing may be thrown into the browser, where an exception of the engine arrives without its message.
     * That holds for errors too, which a shooter passes on when the bot under it fails.
     */
    private fun answer(value: () -> JsonElement): String {
        val answer =
            try {
                buildJsonObject { put(VALUE, value()) }
            } catch (failure: Throwable) {
                buildJsonObject { put(ERROR, json.encodeToJsonElement(failure.message ?: "$failure")) }
            }
        return answer.toString()
    }

    private companion object {
        const val VALUE = "value"
        const val ERROR = "error"
        val json = Json
    }
}
