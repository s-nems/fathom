package io.github.snems.fathom.arena

/**
 * What the task gives for every index below [count], in the order of the indices. Code in the browser runs on
 * one thread, so the tasks run one after another, and the page spreads the work over workers instead.
 */
internal fun <T : Any> inParallel(
    count: Int,
    task: (Int) -> T,
): List<T> = List(count, task)
