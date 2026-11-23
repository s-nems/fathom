import { useMemo, useRef, useState } from "react";
import { api } from "@/data/api/client";
import type { RunSummary } from "@/data/api/types";
import { isActive } from "./runs/runState";
import { Alert } from "@/ui/controls/Alert";
import { Button } from "@/ui/controls/Button";
import { Waiting } from "@/ui/controls/Waiting";
import { presetsOf } from "./setup/about";
import { DEFAULT_GAMES } from "./setup/runSize";
import { DEFAULT_SEED } from "@/game/seed";
import { findCell, type CellKey } from "./results/winShare";
import { useCatalogue } from "@/data/api/catalogue";
import { failureMessage, useLoad } from "@/lib/useAsync";
import type { Navigation } from "@/app/useRoute";
import { bestOfColumn, fewerGames, pickOf, runName, type RunPick } from "./arenaModel";
import { HeadToHead } from "./HeadToHead";
import { Inspector } from "./Inspector";
import { RunChips } from "./RunChips";
import { RunPanel } from "./RunPanel";
import { Setup } from "./setup/Setup";
import { useArenaRuns } from "./useArenaRuns";

/**
 * Shooters against layout sources: set a run up, watch it fill its table, and look into one pairing. The run
 * and the pairing on screen are kept in the address, so a reload shows the same.
 */
export function ArenaView({ route, navigate }: Navigation) {
  const catalogue = useCatalogue();
  const presets = useMemo(() => presetsOf(catalogue), [catalogue]);
  const { runs, run, error, refresh } = useArenaRuns(route.params.run);
  const kept = useLoad(api.keepsHistory, []);
  const [setupAsked, setSetupAsked] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [clearFailure, setClearFailure] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  /** Set at once, where the state only changes with the next render: a second click in between starts nothing. */
  const startAsked = useRef(false);
  const [pick, setPick] = useState<RunPick>(() => ({
    shooters: presets[0]?.shooters ?? [],
    layouts: presets[0]?.layouts ?? [],
    games: DEFAULT_GAMES,
    seed: DEFAULT_SEED,
  }));

  if (runs === null) {
    return error === null ? (
      <Waiting>Reading your runs</Waiting>
    ) : (
      <Alert title="Your runs could not be read." detail={error} />
    );
  }

  const first = runs.length === 0;
  const setupOpen = first || setupAsked;
  const busy = runs.some((each) => isActive(each.status));
  const { shooter, layout } = route.params;
  const wanted: CellKey | null = shooter !== undefined && layout !== undefined ? { shooter, layout } : null;
  const cell = run !== null && wanted !== null ? findCell(run.cells, wanted) : undefined;

  const show = (id: string, key?: CellKey) => navigate("arena", { run: id, ...key });

  const openSetup = (from?: RunPick) => {
    if (from !== undefined) setPick(from);
    setFailure(null);
    setSetupAsked(true);
    window.scrollTo({ top: 0 });
  };

  const again = (from: RunSummary, games = from.games) =>
    openSetup({ ...pickOf(from, catalogue.shooters, catalogue.layouts), games });

  const start = async () => {
    if (startAsked.current) return;
    startAsked.current = true;
    setStarting(true);
    try {
      const started = await api.startRun(pick);
      setFailure(null);
      setSetupAsked(false);
      show(started.id);
    } catch (cause) {
      setFailure(failureMessage(cause));
    } finally {
      startAsked.current = false;
      setStarting(false);
    }
  };

  const cancel = async (id: string) => {
    await api.deleteRun(id).catch(() => undefined);
    await refresh();
  };

  const clear = async () => {
    try {
      await api.clearRuns();
      setClearFailure(null);
      navigate("arena");
    } catch (cause) {
      setClearFailure(failureMessage(cause));
    }
    await refresh();
  };

  return (
    <div className="arena-view">
      <div className="head">
        <div className="head-lead">
          <h1>Arena</h1>
          <p>Which way of shooting sinks a fleet in the fewest shots?</p>
        </div>
        {!setupOpen && !busy && (
          <div className="head-actions">
            <Button variant="primary" onClick={() => openSetup()}>
              New run
            </Button>
          </div>
        )}
      </div>
      {setupOpen && (
        <Setup
          first={first}
          pick={pick}
          failure={failure}
          starting={starting}
          onPick={setPick}
          onStart={() => void start()}
          onClose={() => setSetupAsked(false)}
        />
      )}
      {error !== null && <Alert title="Your runs could not be read." detail={error} />}
      {clearFailure !== null && <Alert title="Your runs could not be cleared." detail={clearFailure} />}
      {run !== null && (
        <>
          <RunChips
            runs={runs}
            presets={presets}
            shownId={run.id}
            persistent={kept.state.status !== "ready" || kept.state.data}
            onShow={(id) => show(id)}
            onClear={() => void clear()}
          />
          {run.status === "FAILED" && (
            <div className="arena-failed">
              <Alert
                title={`${runName(run)} stopped after ${run.cellsDone} of ${run.cellsTotal} pairings.`}
                detail={run.error}
                action={
                  <Button size="sm" onClick={() => again(run, fewerGames(run.games))}>
                    Run again with fewer games
                  </Button>
                }
              >
                The results so far are kept.
              </Alert>
            </div>
          )}
          <div className={cell === undefined ? "arena-grid arena-grid-solo" : "arena-grid"}>
            <RunPanel
              run={run}
              selected={cell === undefined ? null : wanted}
              onSelect={(key) => show(run.id, key)}
              onCancel={() => void cancel(run.id)}
              onAgain={() => again(run)}
            />
            {cell !== undefined && (
              <Inspector
                cell={cell}
                best={bestOfColumn(run.cells, cell.layout)}
                seed={run.seed}
                onClose={() => show(run.id)}
              />
            )}
            <HeadToHead key={run.id} run={run} />
          </div>
        </>
      )}
    </div>
  );
}
