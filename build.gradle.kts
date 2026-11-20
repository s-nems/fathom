import org.gradle.api.tasks.testing.logging.TestExceptionFormat
import org.gradle.api.tasks.testing.logging.TestLogEvent
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.dsl.KotlinVersion
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kover)
    alias(libs.plugins.spotless)
    application
}

group = "io.github.snems"
version = "0.1.0-SNAPSHOT"

val javaVersion =
    libs.versions.java
        .get()
        .toInt()
val botJavaVersion =
    libs.versions.botJava
        .get()
        .toInt()

repositories {
    mavenCentral()
}

// The bot is copied into another engine, so it lives in its own source set with nothing but the standard library.
val bot: SourceSet by sourceSets.creating

sourceSets.main {
    compileClasspath += bot.output
    runtimeClasspath += bot.output
}

// Opponents and measurements. Not part of the program.
val arena: SourceSet by sourceSets.creating {
    compileClasspath += bot.output + sourceSets.main.get().output
    runtimeClasspath += bot.output + sourceSets.main.get().output
}

dependencies {
    testImplementation(platform(libs.junit.bom))
    testImplementation(libs.junit.jupiter)
    testImplementation(libs.kotest.assertions)
    testRuntimeOnly(libs.junit.platform.launcher)
}

kotlin {
    jvmToolchain(javaVersion)
    compilerOptions {
        allWarningsAsErrors = true
        extraWarnings = true
    }
    // Tests and the arena see the bot, including what is internal to it.
    listOf("test", arena.name).forEach { name ->
        target.compilations.named(name) {
            associateWith(target.compilations.getByName("bot"))
        }
    }
}

tasks.named<KotlinCompile>("compileBotKotlin") {
    compilerOptions {
        // The engine that receives the bot may run an older Kotlin and an older JDK than this build.
        languageVersion = KotlinVersion.KOTLIN_2_1
        apiVersion = KotlinVersion.KOTLIN_2_1
        jvmTarget = JvmTarget.fromTarget(botJavaVersion.toString())
        freeCompilerArgs.add("-Xjdk-release=$botJavaVersion")
        // Compiling for an older language version is the point here, not an oversight.
        freeCompilerArgs.add("-Xsuppress-version-warnings")
    }
}

// The source set has no Java, but Gradle checks that its Java and Kotlin tasks agree on the target.
tasks.named<JavaCompile>(bot.compileJavaTaskName) {
    options.release = botJavaVersion
}

// The program ships as one jar, so the bot goes into it.
tasks.jar {
    from(bot.output)
}

application {
    mainClass = "io.github.snems.fathom.app.MainKt"
}

// The arena has no tests of its own, so the build at least compiles it.
tasks.check {
    dependsOn(arena.classesTaskName)
}

tasks.register<JavaExec>("arena") {
    description = "Measures the bot. --args=\"<games> <seed>\" for shots, --args=\"time\" for call times."
    group = "application"
    classpath = arena.runtimeClasspath
    mainClass = "io.github.snems.fathom.arena.ArenaKt"
    // -Pinterpreted turns the JIT compiler off, which is how slow a JVM is before it has warmed up.
    if (providers.gradleProperty("interpreted").isPresent) jvmArgs("-Xint")
}

tasks.test {
    useJUnitPlatform()
    testLogging {
        events(TestLogEvent.FAILED, TestLogEvent.SKIPPED)
        exceptionFormat = TestExceptionFormat.FULL
    }
}

kover {
    currentProject {
        sources {
            excludedSourceSets.add(arena.name)
        }
    }
}

spotless {
    kotlin {
        target("src/**/*.kt")
        // The contract file is provided and stays byte for byte as received.
        targetExclude("src/bot/kotlin/jd/**")
        ktlint(libs.versions.ktlint.get())
    }
    kotlinGradle {
        ktlint(libs.versions.ktlint.get())
    }
}
