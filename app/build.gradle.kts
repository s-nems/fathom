plugins {
    id("fathom-module")
    application
}

dependencies {
    implementation(project(":bot"))
    testImplementation(testFixtures(project(":bot")))
}

application {
    mainClass = "io.github.snems.fathom.app.MainKt"
}

tasks.run {
    workingDir = rootDir
}
