import { useEffect, useRef, useState } from "react";

const FILES = "Files";

const carriesFiles = (event: DragEvent): boolean => event.dataTransfer?.types.includes(FILES) ?? false;

/** Takes a file dropped anywhere on the page. Says whether one is being dragged over it right now. */
export function useFileDrag(onFile: (file: File) => void): boolean {
  const [over, setOver] = useState(false);
  const handler = useRef(onFile);
  handler.current = onFile;

  useEffect(() => {
    /** Entering a child fires before leaving its parent, so the page is left when the count is back at zero. */
    let entered = 0;
    const onEnter = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      entered += 1;
      setOver(true);
    };
    const onLeave = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      entered = Math.max(0, entered - 1);
      if (entered === 0) setOver(false);
    };
    const onOver = (event: DragEvent) => {
      if (carriesFiles(event)) event.preventDefault();
    };
    const onDrop = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      entered = 0;
      setOver(false);
      const file = event.dataTransfer?.files[0];
      if (file !== undefined) handler.current(file);
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  return over;
}
