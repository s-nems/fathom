import type { ReactNode } from "react";
import { Art } from "@/ui/controls/Art";
import { Panel } from "@/ui/controls/Panel";
import { GameForm } from "./GameForm";
import type { GameSetup } from "./gameSetup";
import { LogButton } from "./LogPicker";

interface ReplayStartProps {
  initial: GameSetup;
  busy: boolean;
  /** What the form says about its game: that it is being played, or why it is not shown. */
  formNote: ReactNode;
  /** What the log panel says about the file opened last. */
  logNote: ReactNode;
  onPlay: (setup: GameSetup) => void;
  onLog: (file: File) => void;
}

/** The replay view without a game: the two ways to get one on screen, a form for two bots and a log file. */
export function ReplayStart({ initial, busy, formNote, logNote, onPlay, onLog }: ReplayStartProps) {
  return (
    <div className="replay-start">
      <GameForm initial={initial} busy={busy} onPlay={onPlay}>
        {formNote}
      </GameForm>
      <Panel title="A game log">
        <div className="pad">
          <div className="replay-drop">
            <Art piece="sextant" />
            <b>Drop a log here</b>
            <LogButton onFile={onLog}>Choose a file</LogButton>
            <span className="small">It stays on your device.</span>
          </div>
          {logNote}
        </div>
      </Panel>
    </div>
  );
}
