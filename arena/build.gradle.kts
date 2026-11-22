plugins {
    id("fathom-module")
}

dependencies {
    implementation(project(":bot"))
    implementation(project(":app"))
}

tasks.register<JavaExec>("arena") {
    description = "Measures the bot. --args=\"<games> <seed>\" for shots, --args=\"time\" for call times."
    group = "application"
    classpath = sourceSets.main.get().runtimeClasspath
    mainClass = "io.github.snems.fathom.arena.ArenaKt"
    workingDir = rootDir
    if (providers.gradleProperty("interpreted").isPresent) jvmArgs("-Xint")
}
