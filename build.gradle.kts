plugins {
    id("org.jetbrains.kotlinx.kover")
    alias(libs.plugins.spotless)
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
        target("*.gradle.kts", "*/*.gradle.kts", "buildSrc/src/**/*.gradle.kts")
        ktlint(libs.versions.ktlint.get())
    }
}
