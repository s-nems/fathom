import { Board } from "@/ui/board/Board";
import { HeatLayer } from "@/ui/board/HeatLayer";
import type { HeatMap } from "./heatMaps";

/** A small heat map without numbers, over its caption. Phrasing content only, so it may sit in a button. */
export function MiniHeat({ map, caption }: { map: HeatMap; caption: string }) {
  return (
    <>
      <Board title={caption} detail="mini" ground={<HeatLayer values={map.values} />} />
      <span className="dist-mini-title">{caption}</span>
    </>
  );
}
