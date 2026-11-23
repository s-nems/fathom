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
    testImplementation(project(":app"))
}

tasks.compileKotlin {
    compilerOptions {
        languageVersion = KotlinVersion.KOTLIN_2_1
        apiVersion = KotlinVersion.KOTLIN_2_1
        jvmTarget = JvmTarget.fromTarget(botJavaVersion.toString())
        freeCompilerArgs.add("-Xjdk-release=$botJavaVersion")
        freeCompilerArgs.add("-Xsuppress-version-warnings")
    }
}

tasks.compileJava {
    options.release = botJavaVersion
}
