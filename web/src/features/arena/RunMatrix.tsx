import type { CSSProperties } from "react";
import { aboutLayout, aboutShooter } from "./setup/about";
import type { ArenaTable, Slot, TableRow } from "./results/arenaTable";
import { decimal } from "@/lib/format";
import { sameKey, type CellKey } from "./results/winShare";
import { cellText, tintPercent } from "./arenaModel";

interface SlotCellProps {
  slot: Slot;
  games: number;
  name: string;
  chosen: boolean;
  onSelect: () => void;
}

function SlotCell({ slot, games, name, chosen, onSelect }: SlotCellProps) {
  switch (slot.kind) {
    case "done":
      return (
        <button
          type="button"
          className={slot.best ? "arena-cell arena-cell-done arena-cell-best" : "arena-cell arena-cell-done"}
          style={{ "--share": `${decimal(tintPercent(slot.good))}%` } as CSSProperties}
          aria-pressed={chosen}
          aria-label={`${name}: ${decimal(slot.cell.mean)} shots${slot.best ? ", best in column" : ""}`}
          onClick={onSelect}
        >
          <b>{decimal(slot.cell.mean)}</b>
        </button>
      );
    case "running":
      return (
        <div className="arena-cell arena-cell-pending arena-cell-running">
          <small>
            {slot.gamesDone} / {games}
          </small>
        </div>
      );
    case "queued":
      return (
        <div className="arena-cell arena-cell-pending">
          <small>queued</small>
        </div>
      );
    case "skipped":
      return (
        <div className="arena-cell arena-cell-none">
          <small>not run</small>
        </div>
      );
  }
}

function AverageCell({ row }: { row: TableRow }) {
  if (row.average === null || row.behind === null) return <td className="arena-avg" />;
  return (
    <td className="arena-avg">
      {decimal(row.average)}
      <small>{row.behind === 0 ? "best" : `+${decimal(row.behind)}`}</small>
    </td>
  );
}

interface RunMatrixProps {
  table: ArenaTable;
  /** Games per pairing, the end a running cell counts towards. */
  games: number;
  selected: CellKey | null;
  onSelect: (key: CellKey) => void;
}

/** The table of a run: a row per shooter, best first, a column per layout source, mean shots in each cell. */
export function RunMatrix({ table, games, selected, onSelect }: RunMatrixProps) {
  return (
    <div className="arena-scroll">
      <table className="arena-matrix">
        <thead>
          <tr>
            <th className="arena-axis" />
            <th className="arena-axis" colSpan={table.layouts.length}>
              <span className="label">Fleets placed by</span>
            </th>
            <th />
          </tr>
          <tr>
            <th className="arena-axis">
              <span className="label">Shooter</span>
            </th>
            {table.layouts.map((layout) => (
              <th key={layout} className="arena-col" scope="col" title={aboutLayout(layout)}>
                {layout}
              </th>
            ))}
            <th scope="col">avg</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rank) => (
            <tr key={row.shooter}>
              <th className="arena-row" scope="row" title={aboutShooter(row.shooter)}>
                {row.average !== null && <i>{rank + 1}</i>}
                {row.shooter}
              </th>
              {row.slots.map((slot, column) => {
                const key = { shooter: row.shooter, layout: table.layouts[column] };
                return (
                  <td key={key.layout}>
                    <SlotCell
                      slot={slot}
                      games={games}
                      name={cellText(key)}
                      chosen={selected !== null && sameKey(selected, key)}
                      onSelect={() => onSelect(key)}
                    />
                  </td>
                );
              })}
              <AverageCell row={row} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
