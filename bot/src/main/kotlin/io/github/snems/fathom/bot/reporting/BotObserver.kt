package io.github.snems.fathom.bot.reporting

/**
 * Receives the events of a bot while it plays. What it throws leaves the bot, so it should not throw in a game.
 */
fun interface BotObserver {
    fun on(event: BotEvent)
}
