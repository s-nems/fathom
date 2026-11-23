import { cellPoint } from "@/game/board";
import { heatColour, heatInk } from "./heatColour";
import { CELL, HALF_CELL } from "./boardUnits";

const TEXT_DROP = 0.2;

interface HeatLayerProps {
  /** 0..1 per cell, null leaves the cell as water. */
  values: (number | null)[];
  /** What is printed in each coloured cell, in the ink that reads best on its colour. */
  printed?: string[];
}

/** Colours cells on the heat ramp. Goes into the `ground` of a board, under its grid. */
export function HeatLayer({ values, printed }: HeatLayerProps) {
  return (
    <g aria-hidden="true">
      {values.map((value, index) => {
        if (value === null) return null;
        const { x, y } = cellPoint(index);
        return (
          <g key={index}>
            <rect x={x * CELL} y={y * CELL} width={CELL} height={CELL} fill={heatColour(value)} />
            {printed && (
              <text className={`ink-${heatInk(value)}`} x={x * CELL + HALF_CELL} y={y * CELL + HALF_CELL + TEXT_DROP}>
                {printed[index]}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
