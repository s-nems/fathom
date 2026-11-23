import { useEffect, useState } from "react";
import { api } from "@/data/api/client";
import type { Ship } from "@/data/api/types";
import { Alert } from "@/ui/controls/Alert";
import { NumberInput, Select } from "@/ui/controls/Field";
import { Waiting } from "@/ui/controls/Waiting";
import { grouped } from "@/lib/format";
import { DEFAULT_SEED, MAX_SEED, MIN_SEED, randomSeed } from "@/game/seed";
import { pick, useCatalogue } from "@/data/api/catalogue";
import { LayoutMaps } from "./LayoutMaps";
import { FLEETS, within } from "./limits";
import { useComputed } from "./useComputed";

const SAMPLES_SHOWN = 6;

/** Where a layout source puts its ships: the share of fleets on every cell, by ship size, and a few fleets. */
export function LayoutHeat({ onBusy }: { onBusy: (busy: boolean) => void }) {
  const { layouts } = useCatalogue();
  const [source, setSource] = useState(() => pick(layouts));
  const [fleets, setFleets] = useState(FLEETS.initial);
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [drawn, setDrawn] = useState<{ key: string; fleets: Ship[][] } | null>(null);

  const count = within(fleets, FLEETS);
  const key = JSON.stringify([source, count, seed]);
  const { data, busy, error } = useComputed(key, async (signal) => ({
    key,
    heat: await api.layoutHeat({ source, count, seed }, signal),
  }));
  useEffect(() => onBusy(busy), [busy, onBusy]);

  const shuffle = () => {
    const seeds = Array.from({ length: SAMPLES_SHOWN }, randomSeed);
    void Promise.all(seeds.map((one) => api.drawLayout(source, one))).then(
      (drawnFleets) => setDrawn({ key, fleets: drawnFleets }),
      () => undefined,
    );
  };

  return (
    <>
      <div className="dist-toolbar">
        <Select label="Layout source" value={source} options={layouts} onChange={setSource} />
        <NumberInput label="Fleets" value={fleets} min={FLEETS.min} max={FLEETS.max} onChange={setFleets} />
        <NumberInput label="Seed" value={seed} min={MIN_SEED} max={MAX_SEED} onChange={setSeed} />
      </div>
      {error !== null && (
        <Alert title="The map could not be computed." detail={error}>
          Change an option to try again.
        </Alert>
      )}
      {data === undefined ? (
        error === null && <Waiting>Drawing {grouped(count)} fleets</Waiting>
      ) : (
        <LayoutMaps
          heat={data.heat}
          samples={drawn !== null && drawn.key === data.key ? drawn.fleets : data.heat.samples.slice(0, SAMPLES_SHOWN)}
          busy={busy}
          onShuffle={shuffle}
        />
      )}
    </>
  );
}
