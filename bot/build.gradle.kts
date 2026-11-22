import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.dsl.KotlinVersion

plugins {
    alias(libs.plugins.kotlin.jvm)
    `java-test-fixtures`
}

val botJavaVersion =
    libs.versions.botJava
        .get()
        .toInt()

dependencies {
    // The bot is tested against the referee. Its own code depends on nothing but the standard library.
    testImplementation(project(":app"))
}

tasks.compileKotlin {
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

// The module has no Java, but Gradle checks that its Java and Kotlin tasks agree on the target.
tasks.compileJava {
    options.release = botJavaVersion
}
