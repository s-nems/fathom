import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/data/api/client";
import type { Run, RunSummary } from "@/data/api/types";
import { isActive } from "./runs/runState";
import { failureMessage } from "@/lib/useAsync";
import { shownRunId } from "./arenaModel";

/** How often the runs are read again while one of them is queued or running. */
const POLL_INTERVAL_MS = 500;

export interface ArenaRuns {
  /** Every run, newest first. Null until the first answer. */
  runs: RunSummary[] | null;
  /** The run on screen: the wanted one, or the newest when there is no such run. */
  run: Run | null;
  error: string | null;
  refresh: () => Promise<void>;
}

interface Loaded {
  runs: RunSummary[] | null;
  run: Run | null;
  error: string | null;
}

/** The runs of this browser and the one on screen, read again at an interval while a run is under way. */
export function useArenaRuns(wantedId: string | undefined): ArenaRuns {
  const [loaded, setLoaded] = useState<Loaded>({ runs: null, run: null, error: null });
  const latest = useRef(0);
  const reading = useRef(false);

  const refresh = useCallback(async () => {
    const ticket = ++latest.current;
    reading.current = true;
    try {
      const runs = await api.runs();
      const id = shownRunId(runs, wantedId);
      const run = id === undefined ? null : await api.run(id);
      if (ticket === latest.current) setLoaded({ runs, run, error: null });
    } catch (cause) {
      if (ticket === latest.current) setLoaded((current) => ({ ...current, error: failureMessage(cause) }));
    } finally {
      if (ticket === latest.current) reading.current = false;
    }
  }, [wantedId]);

  useEffect(() => {
    void refresh();
    return () => {
      latest.current += 1;
      reading.current = false;
    };
  }, [refresh]);

  const active = loaded.runs?.some((each) => isActive(each.status)) ?? false;
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      if (!reading.current) void refresh();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [active, refresh]);

  return { ...loaded, refresh };
}
