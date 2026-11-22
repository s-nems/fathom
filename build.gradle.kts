import org.gradle.api.tasks.testing.logging.TestExceptionFormat
import org.gradle.api.tasks.testing.logging.TestLogEvent
import org.jetbrains.kotlin.gradle.dsl.KotlinJvmProjectExtension

plugins {
    alias(libs.plugins.kotlin.jvm) apply false
    alias(libs.plugins.kover)
    alias(libs.plugins.spotless)
}

val javaVersion =
    libs.versions.java
        .get()
        .toInt()

subprojects {
    apply(plugin = "org.jetbrains.kotlin.jvm")
    apply(plugin = "org.jetbrains.kotlinx.kover")

    group = "io.github.snems"
    version = "0.1.0-SNAPSHOT"

    dependencies {
        "testImplementation"(platform(rootProject.libs.junit.bom))
        "testImplementation"(rootProject.libs.junit.jupiter)
        "testImplementation"(rootProject.libs.kotest.assertions)
        "testRuntimeOnly"(rootProject.libs.junit.platform.launcher)
    }

    configure<KotlinJvmProjectExtension> {
        jvmToolchain(javaVersion)
        compilerOptions {
            allWarningsAsErrors = true
            extraWarnings = true
        }
    }

    tasks.withType<Test>().configureEach {
        useJUnitPlatform()
        testLogging {
            events(TestLogEvent.FAILED, TestLogEvent.SKIPPED)
            exceptionFormat = TestExceptionFormat.FULL
        }
    }
}

dependencies {
    kover(project(":bot"))
    kover(project(":app"))
}

tasks.check {
    dependsOn("koverHtmlReport")
}

spotless {
    kotlin {
        target("*/src/**/*.kt")
        // The contract file is provided and stays byte for byte as received.
        targetExclude("bot/src/main/kotlin/jd/**")
        ktlint(libs.versions.ktlint.get())
    }
    kotlinGradle {
        target("*.gradle.kts", "*/*.gradle.kts")
        ktlint(libs.versions.ktlint.get())
    }
}
