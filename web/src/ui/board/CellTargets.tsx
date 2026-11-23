import { useRef, useState, type KeyboardEvent } from "react";
import { CELL_INDICES, cellIndex, cellPoint, isOnBoard, type Point } from "@/game/board";
import { SPACE } from "@/lib/useKeys";
import { CELL } from "./boardUnits";

const ARROW_STEPS: Record<string, Point> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

/**
 * What the cells of a board answer to. One cell is in the tab order and the arrow keys move between cells.
 */
export interface CellInteraction {
  describe: (x: number, y: number) => string;
  onActivate: (x: number, y: number) => void;
  /** The cell under the pointer or holding the focus, null when neither. */
  onPoint?: (cell: Point | null) => void;
  isDisabled?: (x: number, y: number) => boolean;
}

/** One invisible target per cell, on top of everything a board draws. */
export function CellTargets({ interaction }: { interaction: CellInteraction }) {
  const { describe, onActivate, onPoint, isDisabled } = interaction;
  const [focused, setFocused] = useState(0);
  const cells = useRef<(SVGRectElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent, x: number, y: number) => {
    const step = ARROW_STEPS[event.key];
    if (step !== undefined && isOnBoard(x + step.x, y + step.y)) {
      event.preventDefault();
      cells.current[cellIndex(x + step.x, y + step.y)]?.focus();
    }
    if (event.key === "Enter" || event.key === SPACE) {
      event.preventDefault();
      if (!isDisabled?.(x, y)) onActivate(x, y);
    }
  };

  return (
    <g onMouseLeave={() => onPoint?.(null)}>
      {CELL_INDICES.map((index) => {
        const { x, y } = cellPoint(index);
        const disabled = isDisabled?.(x, y) ?? false;
        return (
          <rect
            key={index}
            ref={(element) => {
              cells.current[index] = element;
            }}
            className="target target-button"
            x={x * CELL}
            y={y * CELL}
            width={CELL}
            height={CELL}
            rx={1}
            role="button"
            tabIndex={index === focused ? 0 : -1}
            aria-label={describe(x, y)}
            aria-disabled={disabled}
            onMouseEnter={() => onPoint?.({ x, y })}
            onFocus={() => {
              setFocused(index);
              onPoint?.({ x, y });
            }}
            onBlur={() => onPoint?.(null)}
            onClick={disabled ? undefined : () => onActivate(x, y)}
            onKeyDown={(event) => onKeyDown(event, x, y)}
          />
        );
      })}
    </g>
  );
}
