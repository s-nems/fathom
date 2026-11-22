plugins {
    // Settings plugins are resolved before the version catalog exists, so this version cannot live there.
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

dependencyResolutionManagement {
    repositories {
        mavenCentral()
    }
}

rootProject.name = "fathom"

include("bot", "app", "arena")
