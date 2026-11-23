import org.gradle.api.tasks.testing.logging.TestExceptionFormat
import org.gradle.api.tasks.testing.logging.TestLogEvent
import org.jetbrains.kotlin.gradle.ExperimentalWasmDsl

plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.kotlin.serialization)
}

group = "io.github.snems"
version = "0.1.0-SNAPSHOT"

kotlin {
    jvmToolchain(
        libs.versions.java
            .get()
            .toInt(),
    )
    compilerOptions {
        allWarningsAsErrors = true
        extraWarnings = true
    }

    jvm()
    @OptIn(ExperimentalWasmDsl::class)
    wasmJs {
        browser()
        binaries.library()
        generateTypeScriptDefinitions()
    }

    sourceSets {
        commonMain {
            // The engine is the code of the other modules built for one more platform, so it compiles their
            // sources instead of copying them. The few files that need the JVM stay out and are listed below.
            // One of them, Parallel.kt, has a counterpart here, Sequential.kt.
            kotlin.srcDir("../bot/src/main/kotlin")
            kotlin.srcDir("../app/src/main/kotlin")
            kotlin.srcDir("../arena/src/main/kotlin")
            kotlin.exclude(
                "io/github/snems/fathom/bot/reporting/BotLog.kt",
                "io/github/snems/fathom/app/**",
                "io/github/snems/fathom/arena/Arena.kt",
                "io/github/snems/fathom/arena/EstimateFormat.kt",
                "io/github/snems/fathom/arena/MoveTimes.kt",
                "io/github/snems/fathom/arena/Parallel.kt",
                "io/github/snems/fathom/arena/layouts/FileLayouts.kt",
                "io/github/snems/fathom/arena/layouts/LayoutFile.kt",
            )
            dependencies {
                implementation(libs.kotlinx.serialization.json)
            }
        }
        commonTest {
            kotlin.srcDir("../bot/src/testFixtures/kotlin")
            dependencies {
                implementation(kotlin("test"))
                implementation(libs.kotest.assertions)
            }
        }
    }
}

tasks.named<Test>("jvmTest") {
    useJUnitPlatform()
    testLogging {
        events(TestLogEvent.FAILED, TestLogEvent.SKIPPED)
        exceptionFormat = TestExceptionFormat.FULL
    }
}

/**
 * Compiling for the browser needs only the Kotlin compiler, and every build does it. Everything past that
 * (linking, optimising, packing, running tests in a browser) needs Node, Yarn and Binaryen, which the Kotlin
 * plugin downloads. Those tasks run only in a build that asks for the bundle with `:engine:wasm`, or that
 * sets `-Pengine.browser=true` to run another of them.
 */
val compilerOnlyTasks = setOf("compileKotlinWasmJs", "wasmJsProcessResources", "wasmJsMainClasses", "wasmJsJar")
val browserTools = listOf("wasm", "node", "npm", "yarn", "binaryen", "packagejson")
val askedForTheBrowser = providers.gradleProperty("engine.browser").map(String::toBoolean).orElse(false)

gradle.taskGraph.whenReady {
    val browserBuild = askedForTheBrowser.get() || hasTask(":engine:wasm")
    allTasks
        .filter { it.project == project || it.project == rootProject }
        .filter { needsTheBrowserTools(it.name) }
        .forEach { it.enabled = browserBuild }
}

fun needsTheBrowserTools(task: String): Boolean =
    task !in compilerOnlyTasks && browserTools.any { it in task.lowercase() }

tasks.register("wasm") {
    description = "Builds the engine for the browser into build/dist/wasmJs/productionLibrary."
    group = "build"
    dependsOn("wasmJsBrowserProductionLibraryDistribution")
}
