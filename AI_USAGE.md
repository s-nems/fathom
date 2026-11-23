# AI usage

Agent: Claude Code, with Fable 5.2 as the orchestrator and Opus 5.5 as the model of the worker subagents. The
main session orchestrated: it started separate agents for research and for reviews and wrote their briefs.
They had no view of the main conversation.

I decided the scope, the design and what was accepted. A step counted as done after a green build, a review by
a separate agent and, for a change to how the bot plays, a measurement in the arena.

Each prompt condenses several messages of mine, translated from Polish.

## Example 1: research and a reviewed plan before any code

Prompt, after the agent had unpacked the statement, the contract and the sample log:

> The task is a Battleships game in Kotlin and a bot that plays a series of games against the organiser's bot.
> They copy the bot's sources into their own engine, a new instance for every game, and a move slower than
> 500 ms loses. The goal is a bot that plays as well as we can make it, in code of production quality.
>
> Start with research, split between subagents: what is known about shooting and about placing ships, how
> many shots the known methods need, and whether a network trained by self-play could beat a scripted bot.
> The network is an optional last step.
>
> Then propose the architecture and a plan, and have a separate agent review the plan before any code is
> written.
>
> Rules for the code: the simplest design that does the job, types with one responsibility, nothing built for
> a need we do not have. We write our own referee and a set of reference opponents, so that every claim about
> how well the bot plays is a measurement. The bot keeps no state between games, as the tournament gives it
> none. Its time for a move is far below 500 ms, measured in the worst case, not assumed.

The main session started one agent per question: how to shoot, how to place, whether a network can win, the
versions of the tools. The agents on shooting and placing wrote throwaway simulations of this variant of the
rules. The plan came from their reports, and the reviewer got the plan, the statement, the contract and the
sample log.

Check: I compared each finding with the statement and had the reviewer's script run again in the main
session. The arena, written later, measured what the first finding claimed.

| Finding of the reviewer | Decision |
|---|---|
| The shooter in the sample log always fires at the cell where the most single ships still fit (23 of 23 shots with no open hit). Against it the layout matters more than the plan assumed | Accepted. Placement moved ahead of shooting. In the arena the layout costs that shooter 7 shots, and the bot's better shooting saves 1.4 |
| After a refused placement the planned bot repeats the same ship and forfeits on the third try | Accepted. After a refusal the bot answers differently, as long as another answer within the rules exists |
| The time of a move was estimated from a simulation in C. A first call on a cold JVM can be many times slower | Accepted. An answer stops improving after 100 ms, the clock is passed in, and the arena times the longest call with the JIT compiler off |
| Nothing checks the log format except strings typed by hand | Accepted. `ReplayingLogTest` plays a logged game again through the referee and compares the log byte for byte. It runs on a game of our own, and locally on the organiser's sample, which is not in the repository |

## Example 2: modules in place of source sets

I opened the project in the IDE and could not tell what belongs where.

Prompts:

> `src/arena`, `src/bot` and `src/main` are source sets of one project, and a reader cannot tell which of them
> the tournament copies or where to look for what. Why not Gradle modules?

> Does a plugin in `buildSrc` pay off for three modules? Unless there is a reason for it, move the shared
> settings to the root build script.

Check: `./gradlew build`, then `./gradlew run` and the arena, which gave the same numbers as before.

| What I questioned | Decision |
|---|---|
| Source sets in one project. The agent wanted to keep them, because modules make internals of the bot public | Changed to the modules `bot`, `app` and `arena`. The price: the constructor of `FathomBot` with settings, `LayoutPolicy` and `SamplerSettings` are public |
| The agent put the shared build settings into a plugin in `buildSrc` | Changed. They are one block in the root build script |

## Example 3: my review of the bot

I read the `bot` package and asked about everything I could not follow.

Prompts:

> Review of the `bot` package. A failure in the bot's own code is caught and dropped, so nothing shows that it
> happened or why. What does the field `unanswered` do? It reads like a workaround: explain it or replace it.

> I cannot see what the bot does while it plays. Replace `println` with a logger, at info, warning and error
> only.

Check: `./gradlew build` after each change. Then I ran the game and read the code and the output again.

| What I questioned | Decision |
|---|---|
| The field `unanswered` guessed a refused shot from a result that never came | Replaced. A shot that is offered again was refused. The existing test passed unchanged |
| Failures of the bot's own code were swallowed | Changed. The bot reports every answer, refusal and failure to an observer. `BotLog` in `app` writes them to the logger of the JDK, so the bot needs nothing but the standard library |
| The agent kept `println` for the tables of the arena | Rejected. Everything goes through a logger |
| A separate reviewer got 106,000 warnings from the bot under hostile input | Changed. The tournament bot reports nothing unless it is given an observer |
