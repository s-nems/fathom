import type { ReactNode } from "react";
import { Alert } from "@/ui/controls/Alert";
import { Button } from "@/ui/controls/Button";
import { NumberInput } from "@/ui/controls/Field";
import { Panel } from "@/ui/controls/Panel";
import { Segmented } from "@/ui/controls/Segmented";
import {
  aboutLayout,
  aboutShooter,
  layoutGroups,
  presetMatching,
  presetsOf,
  shooterGroups,
  type OptionGroup,
} from "./about";
import { grouped } from "@/lib/format";
import { GAME_SIZES, gamesInRun, runSize, SIZE_TEXT } from "./runSize";
import { MAX_SEED, MIN_SEED } from "@/game/seed";
import { useCatalogue } from "@/data/api/catalogue";
import { toggled, type RunPick } from "../arenaModel";
import { LayoutThumb, ShooterThumb } from "./thumbs";

interface OptionListProps {
  title: string;
  hint: string;
  groups: OptionGroup[];
  all: string[];
  chosen: string[];
  about: (name: string) => string;
  thumb: (name: string) => ReactNode;
  onChange: (chosen: string[]) => void;
}

/** Every option of one kind under its group, each with a picture and a line saying what it is. */
function OptionList({ title, hint, groups, all, chosen, about, thumb, onChange }: OptionListProps) {
  return (
    <div>
      <h3 className="arena-picker-title">
        {title} <small>{hint}</small>
        <span className="num dim">
          {chosen.length} of {all.length}
        </span>
      </h3>
      {groups.map((group) => (
        <div key={group.title} role="group" aria-label={group.title}>
          <div className="arena-group label">{group.title}</div>
          {group.names.map((name) => (
            <button
              key={name}
              type="button"
              className="arena-opt"
              aria-pressed={chosen.includes(name)}
              onClick={() => onChange(toggled(all, chosen, name))}
            >
              <span className="arena-tick" aria-hidden="true" />
              {thumb(name)}
              <span className="arena-opt-text">
                <b>{name}</b>
                {about(name) !== "" && <small>{about(name)}</small>}
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

interface SetupProps {
  /** A first visit has nothing to go back to, so the panel cannot be closed. */
  first: boolean;
  pick: RunPick;
  /** Why the last start did not work. */
  failure: string | null;
  /** A start is under way, so another one cannot be asked for. */
  starting: boolean;
  onPick: (pick: RunPick) => void;
  onStart: () => void;
  onClose: () => void;
}

/** What a run compares and how long it will take, before it starts. */
export function Setup({ first, pick, failure, starting, onPick, onStart, onClose }: SetupProps) {
  const catalogue = useCatalogue();
  const presets = presetsOf(catalogue);
  const preset = presetMatching(presets, pick.shooters, pick.layouts);
  const games = gamesInRun(pick.shooters.length, pick.layouts.length, pick.games);
  const ready = pick.shooters.length > 0 && pick.layouts.length > 0;
  const size = runSize(games);

  return (
    <Panel
      className="arena-setup"
      title={first ? "Choose what to compare" : "New run"}
      aside={
        first ? undefined : (
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      <div className="pad">
        <div className="arena-presets">
          <span className="label">Start from</span>
          <Segmented
            label="Start from"
            value={preset?.id}
            options={presets.map(({ id, label }) => ({ value: id, label }))}
            onChange={(id) => {
              const chosen = presets.find((each) => each.id === id);
              if (chosen !== undefined) onPick({ ...pick, shooters: chosen.shooters, layouts: chosen.layouts });
            }}
          />
        </div>
        <div className="arena-picker">
          <OptionList
            title="Shooters"
            hint="how the next shot is chosen"
            groups={shooterGroups(catalogue)}
            all={catalogue.shooters}
            chosen={pick.shooters}
            about={aboutShooter}
            thumb={(name) => <ShooterThumb shooter={name} />}
            onChange={(shooters) => onPick({ ...pick, shooters })}
          />
          <OptionList
            title="Layout sources"
            hint="how a fleet is placed"
            groups={layoutGroups(catalogue)}
            all={catalogue.layouts}
            chosen={pick.layouts}
            about={aboutLayout}
            thumb={(name) => <LayoutThumb source={name} />}
            onChange={(layouts) => onPick({ ...pick, layouts })}
          />
        </div>
        <div className="arena-estimate">
          <span className="inline">
            <span className="label">Games per pairing</span>
            <Segmented
              label="Games per pairing"
              value={pick.games}
              options={GAME_SIZES.map((value) => ({ value, label: String(value) }))}
              onChange={(value) => onPick({ ...pick, games: value })}
            />
          </span>
          <NumberInput
            label="Seed"
            inline
            value={pick.seed}
            min={MIN_SEED}
            max={MAX_SEED}
            onChange={(seed) => onPick({ ...pick, seed })}
          />
          <span className="arena-estimate-end inline">
            <span role="status">
              {ready ? (
                <>
                  <b className="num">{grouped(games)}</b> games, {SIZE_TEXT[size]}
                </>
              ) : (
                "Pick at least one of each."
              )}
            </span>
            <Button variant="primary" disabled={!ready || starting} onClick={onStart}>
              Start run
            </Button>
          </span>
        </div>
        {ready && size === "large" && (
          <div className="arena-setup-note">
            <Alert tone="warn" title="Large run.">
              It runs on your device and goes on where it stopped when you open this page again. You can cancel and keep
              what is done.
            </Alert>
          </div>
        )}
        {failure !== null && (
          <div className="arena-setup-note">
            <Alert title="The run did not start." detail={failure} />
          </div>
        )}
      </div>
    </Panel>
  );
}
