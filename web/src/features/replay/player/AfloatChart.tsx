import type { Player } from "@/data/api/types";
import type { Course } from "./afloat";
import { PLAYERS, type SideName } from "@/game/players";

const WIDTH = 600;
const HEIGHT = 64;
const TOP = 4;
const BOTTOM = 8;
const TICK = { width: 2.4, height: 6 };
/** Widths in pixels of the screen, as the strokes do not scale with the chart. */
const COURSE_WIDTH = 2;
const CURSOR_WIDTH = 1.5;
const STROKE: Record<Player, string> = { ONE: "var(--one)", TWO: "var(--two)" };
const LEGEND: Record<Player, string> = { ONE: "replay-legend-line dot-one", TWO: "replay-legend-line dot-two" };

interface AfloatChartProps {
  course: Course;
  fleetCells: number;
  names: Record<Player, SideName>;
  position: number;
}

/** How the game went: the ship cells each side had left after every shot, with a tick where a ship sank. */
export function AfloatChart({ course, fleetCells, names, position }: AfloatChartProps) {
  const shots = course.afloat.ONE.length - 1;
  const x = (shot: number) => (shots > 0 ? (shot / shots) * WIDTH : 0);
  const y = (cells: number) => TOP + (1 - cells / fleetCells) * (HEIGHT - TOP - BOTTOM);
  const steps = (owner: Player) =>
    `M0 ${y(fleetCells)}` +
    course.afloat[owner]
      .slice(1)
      .map((cells, index) => `H${x(index + 1)}V${y(cells)}`)
      .join("");

  return (
    <>
      <div className="replay-chart-head">
        <span className="label">Ship cells afloat</span>
        <span className="key end">
          {PLAYERS.map((player) => (
            <span key={player}>
              <i className={LEGEND[player]} />
              {names[player].short}
            </span>
          ))}
        </span>
      </div>
      <svg
        className="replay-afloat"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Ship cells afloat after shot ${position}: ${PLAYERS.map((player) => `${names[player].short} ${course.afloat[player][position]}`).join(", ")}`}
      >
        <path
          d={[0, fleetCells / 2, fleetCells].map((cells) => `M0 ${y(cells)}H${WIDTH}`).join("")}
          stroke="var(--line)"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        <rect className="replay-afloat-future" x={x(position)} width={WIDTH - x(position)} height={HEIGHT} />
        {PLAYERS.map((player) => (
          <path
            key={player}
            d={steps(player)}
            stroke={STROKE[player]}
            strokeWidth={COURSE_WIDTH}
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {course.sinkings.map((sinking) => (
          <rect
            key={sinking.afterShot}
            x={x(sinking.afterShot) - TICK.width / 2}
            y={HEIGHT - TICK.height}
            width={TICK.width}
            height={TICK.height}
            fill={STROKE[sinking.owner]}
          />
        ))}
        <path
          d={`M${x(position)} 0V${HEIGHT}`}
          stroke="var(--text)"
          strokeWidth={CURSOR_WIDTH}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </>
  );
}
