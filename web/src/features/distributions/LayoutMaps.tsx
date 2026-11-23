import type { LayoutHeat as LayoutHeatAnswer, Ship } from "@/data/api/types";
import { Board } from "@/ui/board/Board";
import { HeatRamp } from "@/ui/board/BoardKey";
import { Button } from "@/ui/controls/Button";
import { HeatLayer } from "@/ui/board/HeatLayer";
import { Panel } from "@/ui/controls/Panel";
import { ShipsLayer } from "@/ui/board/ShipsLayer";
import { grouped, percent } from "@/lib/format";
import { layoutFacts } from "./layoutFacts";
import { Fact } from "./Fact";
import { layoutMap, sizeMaps } from "./heatMaps";
import { MiniHeat } from "./MiniHeat";

/** The ends of the ramp are whole percentages, as the numbers printed in the cells are. */
const RAMP_DIGITS = 0;

interface LayoutMapsProps {
  heat: LayoutHeatAnswer;
  samples: Ship[][];
  busy: boolean;
  onShuffle: () => void;
}

/** A layout answer drawn: the large map, what stands out in it, a map per ship size and a few fleets. */
export function LayoutMaps({ heat, samples, busy, onShuffle }: LayoutMapsProps) {
  const map = layoutMap(heat.cells, heat.count);
  const facts = layoutFacts(map.shares);
  const sizes = sizeMaps(heat.bySize, heat.count);
  return (
    <div className={busy ? "dist busy" : "dist"} aria-busy={busy}>
      <Panel title="Any ship" aside={<span className="dim small">% of fleets covering the cell</span>}>
        <div className="pad dist-map">
          <Board
            title={`Share of ${grouped(heat.count)} fleets of ${heat.source} with a ship on each cell`}
            ground={<HeatLayer values={map.values} printed={map.printed} />}
          />
        </div>
        <div className="panel-foot num">
          <HeatRamp low={percent(map.low, RAMP_DIGITS)} high={percent(map.high, RAMP_DIGITS)} />
        </div>
      </Panel>
      <div className="stack">
        <Panel>
          <dl className="pad dist-facts">
            <Fact label="Edge cells" value={percent(facts.edge)} />
            <Fact label="Inner cells" value={percent(facts.inner)} />
            <Fact label="Most covered" value={percent(facts.most.share)} where={facts.most.cell} />
            <Fact label="Least covered" value={percent(facts.least.share)} where={facts.least.cell} />
          </dl>
        </Panel>
        <Panel title="By ship size">
          <div className="pad dist-multiples">
            {sizes.map(({ size, map: sizeMap }) => (
              <div key={size}>
                <MiniHeat map={sizeMap} caption={`size ${size}`} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          title="Sample fleets"
          aside={
            <Button variant="ghost" size="sm" onClick={onShuffle} disabled={busy}>
              Shuffle
            </Button>
          }
        >
          <div className="pad dist-samples">
            {samples.map((fleet, index) => (
              <Board key={index} title={`Sample fleet ${index + 1}`} detail="mini">
                <ShipsLayer ships={fleet} />
              </Board>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
