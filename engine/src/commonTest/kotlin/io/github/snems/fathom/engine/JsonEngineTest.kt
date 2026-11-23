package io.github.snems.fathom.engine

import io.kotest.matchers.collections.shouldContainExactly
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain
import io.kotest.matchers.string.shouldStartWith
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import kotlin.test.Test
import kotlin.time.TestTimeSource

class JsonEngineTest {
    private val engine = JsonEngine(TestTimeSource())

    @Test
    fun shouldAnswerTheCatalogueInTheShapeThePageKnows() {
        // when
        val value = valueOf(engine.catalogue())

        // then
        value.keys shouldContainExactly setOf("layouts", "shooters", "boardSize", "fleet", "limits")
    }

    @Test
    fun shouldAnswerAGameInTheShapeThePageKnows() {
        // given
        val request = """{"one":$SIDE,"two":$SIDE,"seed":1}"""

        // when
        val answer = engine.playGame(request)

        // then
        valueOf(answer).keys shouldContainExactly GAME_FIELDS
        answer shouldContain """"players":{"ONE":"sequential / random","TWO":"sequential / random"}"""
        answer shouldContain """"result":{"winner":"""
        answer shouldContain """"weights":null,"millis":0.0,"at":null"""
    }

    @Test
    fun shouldAnswerAGameOfAHumanInTheShapeThePageKnows() {
        // given
        val fleet = valueText(engine.drawLayout("""{"source":"sequential","seed":1}"""))
        val request = """{"fleet":$fleet,"opponent":$SIDE,"seed":1,"firstShooter":"ONE","shots":[{"x":0,"y":0}]}"""

        // when
        val value = valueOf(engine.playHumanGame(request))

        // then
        value.keys shouldContainExactly setOf("game", "yourTurn", "over")
        value.getValue("game").jsonObject.keys shouldContainExactly GAME_FIELDS
    }

    @Test
    fun shouldAnswerALogInTheShapeThePageKnows() {
        // when
        val value = valueOf(engine.readLog("a game", "19:05:03.050 shot: pos=(4,4) result=miss"))

        // then
        value.keys shouldContainExactly GAME_FIELDS
    }

    @Test
    fun shouldAnswerTheHeatOfALayoutSourceInTheShapeThePageKnows() {
        // when
        val value = valueOf(engine.layoutHeat("""{"source":"sequential","count":2,"seed":1}"""))

        // then
        value.keys shouldContainExactly setOf("source", "count", "cells", "bySize", "samples")
    }

    @Test
    fun shouldAnswerAFleetInTheShapeThePageKnows() {
        // when
        val answer = engine.drawLayout("""{"source":"sequential","seed":1}""")

        // then
        answer shouldStartWith """{"value":[{"size":5,"x":"""
    }

    @Test
    fun shouldAnswerTheHeatOfAShooterInTheShapeThePageKnows() {
        // when
        val value = valueOf(engine.shooterHeat("""{"shooter":"random","layout":"sequential","games":2,"seed":1}"""))

        // then
        value.keys shouldContainExactly setOf("shooter", "layout", "games", "turns")
    }

    @Test
    fun shouldAnswerAPartOfACellAndItsMeasurementInTheShapeThePageKnows() {
        // given
        val part = """{"shooter":"random","layout":"sequential","seed":1,"firstGame":0,"games":2}"""

        // when
        val chunk = valueOf(engine.cellChunk(part))
        val histogram = chunk.getValue("histogram")
        val cell = valueOf(engine.measurement("""{"shooter":"random","layout":"sequential","histogram":$histogram}"""))

        // then
        chunk.keys shouldContainExactly setOf("histogram")
        cell.keys shouldContainExactly setOf("shooter", "layout", "mean", "margin", "histogram")
    }

    @Test
    fun shouldAnswerWithAnErrorWhenTheCatalogueLacksAName() {
        // when
        val answer = engine.drawLayout("""{"source":"psychic","seed":1}""")

        // then
        answer shouldBe """{"error":"Unknown layout source: psychic"}"""
    }

    @Test
    fun shouldAnswerWithAnErrorWhenTheRequestIsNotJson() {
        // when
        val answer = engine.cellChunk("not json")

        // then
        Json.parseToJsonElement(answer).jsonObject.keys shouldContainExactly setOf("error")
    }

    @Test
    fun shouldAnswerWithAnErrorWhenAFieldIsMissing() {
        // when
        val answer = engine.cellChunk("""{"shooter":"random","layout":"sequential","seed":1,"games":2}""")

        // then
        Json.parseToJsonElement(answer).jsonObject.keys shouldContainExactly setOf("error")
        answer shouldContain "firstGame"
    }

    @Test
    fun shouldAnswerWithAnErrorWhenAFieldHasTheWrongType() {
        // when
        val answer = engine.layoutHeat("""{"source":"sequential","count":"many","seed":1}""")

        // then
        Json.parseToJsonElement(answer).jsonObject.keys shouldContainExactly setOf("error")
    }

    private fun valueOf(answer: String): JsonObject =
        Json.parseToJsonElement(answer).jsonObject.getValue("value").jsonObject

    private fun valueText(answer: String): String = "${Json.parseToJsonElement(answer).jsonObject.getValue("value")}"

    private companion object {
        const val SIDE = """{"layout":"sequential","shooter":"random"}"""
        val GAME_FIELDS = setOf("title", "players", "fleets", "shots", "result")
    }
}
