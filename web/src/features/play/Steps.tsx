import { Fragment } from "react";

/** Where a game against the bot stands: placing the fleet, shooting, or looking back at it. */
export type Stage = "place" | "battle" | "review";

const STEPS: readonly { stage: Stage; label: string }[] = [
  { stage: "place", label: "Place" },
  { stage: "battle", label: "Battle" },
  { stage: "review", label: "Review" },
];

/** The three steps of a game in a row, the current one marked. */
export function Steps({ current }: { current: Stage }) {
  return (
    <ol className="play-steps">
      {STEPS.map(({ stage, label }, index) => (
        <Fragment key={stage}>
          {index > 0 && <li className="play-steps-line" aria-hidden="true" />}
          <li
            className={stage === current ? "play-steps-current" : undefined}
            aria-current={stage === current ? "step" : undefined}
          >
            {index + 1} {label}
          </li>
        </Fragment>
      ))}
    </ol>
  );
}
