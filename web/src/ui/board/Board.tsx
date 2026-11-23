import { createContext, type ReactNode } from "react";
import waterMap from "@/assets/art/water.webp";
import { BOARD_SIZE, cellPoint, columnLabel, LINE_INDICES, rowLabel } from "@/game/board";
import { BOARD_SIDE, CELL, HALF_CELL } from "./boardUnits";
import { CellTargets, type CellInteraction } from "./CellTargets";

/** How much a board shows: coordinates, chart water and engraved ships, or only the cells. */
export type BoardDetail = "full" | "mini";

/** The detail of the board a layer is drawn on. */
export const BoardDetailContext = createContext<BoardDetail>("full");

const GUTTER = 6;
const FAR_MARGIN = 1.6;
const MINI_MARGIN = 0.5;
const FRAME_GAP = 1.1;
const COLUMN_LABEL_Y = -3.9;
const ROW_LABEL_X = -4;
const SOUNDING_OFFSET = { x: 7.4, y: 7.8 };

/** Depths printed in the water of a full board, as a chart prints its soundings: cell and fathoms. */
const SOUNDINGS: readonly (readonly [number, number])[] = [
  [3, 12],
  [17, 9],
  [26, 14],
  [38, 7],
  [41, 16],
  [55, 11],
  [62, 8],
  [70, 15],
  [84, 6],
  [89, 13],
  [96, 10],
];

interface BoardProps {
  /** Read by screen readers as the name of the drawing. */
  title: string;
  detail?: BoardDetail;
  /** Cells drawn in place of the chart water and under the grid, as a heat map is. */
  ground?: ReactNode;
  interaction?: CellInteraction;
  /** Layers, drawn in order over the grid. */
  children?: ReactNode;
}

/** The one 10 by 10 board of the app: water, grid and coordinates. Everything else comes in as layers. */
export function Board({ title, detail = "full", ground, interaction, children }: BoardProps) {
  const full = detail === "full";
  const before = full ? GUTTER : MINI_MARGIN;
  const side = before + BOARD_SIDE + (full ? FAR_MARGIN : MINI_MARGIN);
  return (
    <svg
      className={ground === undefined ? "board bd" : "board bd board-heat"}
      viewBox={`${-before} ${-before} ${side} ${side}`}
      role={interaction ? "group" : "img"}
      aria-label={title}
    >
      {full && <NeatLine />}
      <rect className="water" width={BOARD_SIDE} height={BOARD_SIDE} />
      {ground ?? (full ? <ChartWater /> : <Contours />)}
      <Grid />
      {full && <Coordinates />}
      <BoardDetailContext.Provider value={detail}>{children}</BoardDetailContext.Provider>
      {interaction && <CellTargets interaction={interaction} />}
    </svg>
  );
}

function NeatLine() {
  const ticks = [...LINE_INDICES, BOARD_SIZE]
    .map((i) => {
      const at = i * CELL;
      return `M${at} ${-FRAME_GAP}v${FRAME_GAP}M${-FRAME_GAP} ${at}h${FRAME_GAP}M${at} ${BOARD_SIDE}v${FRAME_GAP}M${BOARD_SIDE} ${at}h${FRAME_GAP}`;
    })
    .join("");
  const side = BOARD_SIDE + 2 * FRAME_GAP;
  return (
    <g aria-hidden="true">
      <rect className="neat" x={-FRAME_GAP} y={-FRAME_GAP} width={side} height={side} />
      <path className="neat" d={ticks} />
    </g>
  );
}

function ChartWater() {
  return (
    <g aria-hidden="true">
      <image className="map" href={waterMap} width={BOARD_SIDE} height={BOARD_SIDE} preserveAspectRatio="none" />
      {SOUNDINGS.map(([cell, depth]) => {
        const { x, y } = cellPoint(cell);
        return (
          <text key={cell} className="sound" x={x * CELL + SOUNDING_OFFSET.x} y={y * CELL + SOUNDING_OFFSET.y}>
            {depth}
          </text>
        );
      })}
    </g>
  );
}

/** A few depth contours, enough to make a small board read as water. */
function Contours() {
  return (
    <g className="contour" aria-hidden="true">
      <ellipse cx="30" cy="34" rx="24" ry="17" transform="rotate(-18 30 34)" />
      <ellipse cx="30" cy="34" rx="15" ry="10" transform="rotate(-18 30 34)" />
      <ellipse cx="30" cy="34" rx="6" ry="4" transform="rotate(-18 30 34)" />
      <ellipse cx="73" cy="72" rx="21" ry="15" transform="rotate(24 73 72)" />
      <ellipse cx="73" cy="72" rx="11" ry="7" transform="rotate(24 73 72)" />
      <path d="M2 88Q22 74 40 97M70 2Q78 22 98 26" />
    </g>
  );
}

function Grid() {
  const lines = LINE_INDICES.slice(1)
    .map((i) => `M${i * CELL} 0v${BOARD_SIDE}M0 ${i * CELL}h${BOARD_SIDE}`)
    .join("");
  return <path className="gridline" d={lines} aria-hidden="true" />;
}

function Coordinates() {
  return (
    <g aria-hidden="true">
      {LINE_INDICES.map((i) => (
        <g key={i}>
          <text className="coord" x={i * CELL + HALF_CELL} y={COLUMN_LABEL_Y}>
            {columnLabel(i)}
          </text>
          <text className="coord" x={ROW_LABEL_X} y={i * CELL + HALF_CELL}>
            {rowLabel(i)}
          </text>
        </g>
      ))}
    </g>
  );
}
