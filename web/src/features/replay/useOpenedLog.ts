import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/data/api/client";
import type { GameRecord } from "@/data/api/types";
import { latest } from "@/lib/latest";
import { failureMessage } from "@/lib/useAsync";

/** A log opened from a file. It lives here and not in the hash, as the file is gone after a reload. */
export interface OpenedLog {
  /** Tells one opened log from the next, so that the replay starts over. */
  serial: number;
  name: string;
  game: GameRecord;
}

/** A file that could not be read as a log. */
export interface BadFile {
  name: string;
  message: string;
}

export interface OpenedLogHandle {
  log: OpenedLog | null;
  bad: BadFile | null;
  open: (file: File) => void;
  close: () => void;
}

/**
 * The log the visitor opened last. A file still being read when a newer one is opened, the log is closed
 * or `place` changes is dropped, so an old answer never replaces what is on screen.
 */
export function useOpenedLog(place: string): OpenedLogHandle {
  const [log, setLog] = useState<OpenedLog | null>(null);
  const [bad, setBad] = useState<BadFile | null>(null);
  const requests = useRef(latest()).current;

  const close = useCallback(() => {
    requests.drop();
    setLog(null);
    setBad(null);
  }, [requests]);

  // Going anywhere else puts the opened log away, and so does leaving the view.
  useEffect(() => close, [place, close]);

  const open = useCallback(
    (file: File) => {
      const isNewest = requests.begin();
      setBad(null);
      file
        .text()
        .then((text) => api.readLog(file.name, text))
        .then(
          (game) => {
            if (isNewest()) setLog((last) => ({ serial: (last?.serial ?? 0) + 1, name: file.name, game }));
          },
          (cause: unknown) => {
            if (isNewest()) setBad({ name: file.name, message: failureMessage(cause) });
          },
        );
    },
    [requests],
  );

  return { log, bad, open, close };
}
