package io.github.snems.fathom.arena

import java.util.stream.IntStream

/**
 * What the task gives for every index below [count], in the order of the indices. The tasks run on all cores,
 * so a task may share nothing with the others. This file needs the JVM, and a build for another platform
 * replaces it.
 */
internal fun <T : Any> inParallel(
    count: Int,
    task: (Int) -> T,
): List<T> =
    IntStream.range(0, count)
        .parallel()
        .mapToObj { index -> task(index) }
        .toList()
