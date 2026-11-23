import type { CSSProperties } from "react";
import { SHIP_ART } from "@/ui/board/ShipsLayer";
import type { TrayRow } from "./placing";

interface FleetTrayProps {
  rows: TrayRow[];
  /** The size the next tap on the board places, null when the fleet is complete. */
  selected: number | null;
  onSelect: (size: number) => void;
}

/** The fleet still to place, one button per ship size, each with the deck plan of its ship. */
export function FleetTray({ rows, selected, onSelect }: FleetTrayProps) {
  return (
    <div className="play-tray" role="group" aria-label="Ship to place">
      {rows.map(({ size, total, placed }) => {
        const done = placed === total;
        const art = SHIP_ART[size];
        return (
          <button
            key={size}
            type="button"
            className={done ? "play-tray-done" : undefined}
            aria-pressed={size === selected}
            disabled={done}
            onClick={() => onSelect(size)}
          >
            <span className="play-tray-hull" style={{ "--cells": size } as CSSProperties}>
              {art === undefined ? <i /> : <img src={art} alt="" />}
            </span>
            <span className="play-tray-name">Ship of {size}</span>
            <span className="play-tray-count">{done ? "placed" : `${placed} of ${total}`}</span>
          </button>
        );
      })}
    </div>
  );
}
