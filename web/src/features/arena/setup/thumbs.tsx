import { useEffect, useState } from "react";
import { api } from "@/data/api/client";
import type { Ship } from "@/data/api/types";
import { Board } from "@/ui/board/Board";
import { FillLayer } from "@/ui/board/FillLayer";
import { HeatLayer } from "@/ui/board/HeatLayer";
import { ShipsLayer } from "@/ui/board/ShipsLayer";
import { DEFAULT_SEED } from "@/game/seed";
import { shooterPicture } from "./thumbData";

/** Tiny boards for the setup lists: a fleet a layout source places, or how a shooter picks cells. */

/** A schematic of how a shooter picks cells, beside its name and so without one of its own. */
export function ShooterThumb({ shooter }: { shooter: string }) {
  const { heat, misses, hits } = shooterPicture(shooter);
  return (
    <span className="arena-thumb" aria-hidden="true">
      <Board title={shooter} detail="mini" ground={heat === null ? undefined : <HeatLayer values={heat} />}>
        <FillLayer cells={misses} tone="miss" />
        <FillLayer cells={hits} tone="hit" />
      </Board>
    </span>
  );
}

const drawn = new Map<string, Promise<Ship[]>>();

/** One fleet of a layout source, drawn once per visit of the page. */
function fleetOf(source: string): Promise<Ship[]> {
  let fleet = drawn.get(source);
  if (fleet === undefined) {
    fleet = api.drawLayout(source, DEFAULT_SEED);
    fleet.catch(() => drawn.delete(source));
    drawn.set(source, fleet);
  }
  return fleet;
}

/** A fleet the layout source really places. Empty water until the engine has drawn it. */
export function LayoutThumb({ source }: { source: string }) {
  const [ships, setShips] = useState<Ship[]>([]);
  useEffect(() => {
    let current = true;
    fleetOf(source).then(
      (fleet) => {
        if (current) setShips(fleet);
      },
      () => undefined,
    );
    return () => {
      current = false;
    };
  }, [source]);
  return (
    <span className="arena-thumb" aria-hidden="true">
      <Board title={source} detail="mini">
        <ShipsLayer ships={ships} />
      </Board>
    </span>
  );
}
