import org.gradle.api.tasks.testing.logging.TestExceptionFormat
import org.gradle.api.tasks.testing.logging.TestLogEvent

plugins {
    id("org.jetbrains.kotlin.jvm")
    id("org.jetbrains.kotlinx.kover")
}

val libs = versionCatalogs.named("libs")

group = "io.github.snems"
version = "0.1.0-SNAPSHOT"

dependencies {
    "testImplementation"(platform(libs.findLibrary("junit-bom").get()))
    "testImplementation"(libs.findLibrary("junit-jupiter").get())
    "testImplementation"(libs.findLibrary("kotest-assertions").get())
    "testRuntimeOnly"(libs.findLibrary("junit-platform-launcher").get())
}

kotlin {
    jvmToolchain(
        libs
            .findVersion("java")
            .get()
            .requiredVersion
            .toInt(),
    )
    compilerOptions {
        allWarningsAsErrors = true
        extraWarnings = true
    }
}

tasks.test {
    useJUnitPlatform()
    testLogging {
        events(TestLogEvent.FAILED, TestLogEvent.SKIPPED)
        exceptionFormat = TestExceptionFormat.FULL
    }
}
