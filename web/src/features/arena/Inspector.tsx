import { useEffect, useRef } from "react";
import type { Cell } from "@/data/api/types";
import { Button, ButtonLink } from "@/ui/controls/Button";
import { Pill } from "@/ui/controls/Pill";
import { aboutLayout, aboutShooter } from "./setup/about";
import { CELL_COUNT } from "@/game/board";
import { decimal } from "@/lib/format";
import { histogramStats } from "./results/histogramStats";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { PERCENT } from "@/lib/number";
import { watchHref } from "@/features/replay/gameSetup";
import { axisPercent, histogramBars } from "./arenaModel";

/** The axis of the histogram. No fleet of the game sinks in fewer shots than the axis starts with. */
const AXIS_FROM = 20;
const AXIS_TO = CELL_COUNT;
const AXIS_STEP = 20;
const AXIS_TICKS = Array.from({ length: (AXIS_TO - AXIS_FROM) / AXIS_STEP + 1 }, (_, i) => AXIS_FROM + i * AXIS_STEP);

interface InspectorProps {
  cell: Cell;
  /** The lowest mean of the column the cell is in. */
  best: number;
  seed: number;
  onClose: () => void;
}

/** One pairing of a run: who shot at whose fleets, and how the games were spread. */
export function Inspector({ cell, best, seed, onClose }: InspectorProps) {
  const panel = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const stats = histogramStats(cell.histogram);
  const side = { layout: cell.layout, shooter: cell.shooter };
  const watch = watchHref({ one: side, two: side, seed });

  useEffect(() => {
    panel.current?.scrollIntoView({ block: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
  }, [cell.shooter, cell.layout, reducedMotion]);

  return (
    <section className="panel arena-inspector" ref={panel}>
      <header className="panel-head">
        <h2>One pairing</h2>
        <div className="panel-aside">
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </header>
      <div className="pad">
        <dl className="arena-who">
          <div>
            <dt>
              <span className="label">Shooter</span>
              <b>{cell.shooter}</b>
            </dt>
            <dd>{aboutShooter(cell.shooter)}</dd>
          </div>
          <div>
            <dt>
              <span className="label">Fleets by</span>
              <b>{cell.layout}</b>
            </dt>
            <dd>{aboutLayout(cell.layout)}</dd>
          </div>
        </dl>
        <div className="arena-mean">
          <span className="arena-big">{decimal(cell.mean)}</span>
          <span className="num dim">± {decimal(cell.margin)} shots</span>
          <span className="arena-mean-end">
            <Pill>{cell.mean === best ? "best in column" : `+${decimal(cell.mean - best)} vs best`}</Pill>
          </span>
        </div>
        {stats !== null && (
          <>
            <div className="arena-stats">
              <div>
                <span className="label">Median</span>
                <b>{stats.median}</b>
              </div>
              <div>
                <span className="label">Fastest</span>
                <b>{stats.fastest}</b>
              </div>
              <div>
                <span className="label">Slowest</span>
                <b>{stats.slowest}</b>
              </div>
            </div>
            <div
              className="arena-hist"
              role="img"
              aria-label={`${stats.games} games, from ${stats.fastest} to ${stats.slowest} shots`}
            >
              {histogramBars(cell.histogram, AXIS_FROM, AXIS_TO).map((height, index) => (
                <i key={index} style={{ height: `${height * PERCENT}%` }} />
              ))}
              <u style={{ left: `${axisPercent(cell.mean, AXIS_FROM, AXIS_TO)}%` }} title="mean" />
            </div>
            <div className="arena-hist-axis">
              {AXIS_TICKS.map((tick) => (
                <span key={tick}>{tick === AXIS_TO ? `${tick} shots` : tick}</span>
              ))}
            </div>
          </>
        )}
        <ButtonLink size="sm" className="arena-watch" href={watch}>
          Watch a game of this pair
        </ButtonLink>
      </div>
    </section>
  );
}
