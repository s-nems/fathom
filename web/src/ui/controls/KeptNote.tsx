import { useState } from "react";

interface KeptNoteProps {
  persistent: boolean;
  /** Asked before anything is forgotten. It names what `onClear` removes. */
  question: string;
  onClear: () => void;
}

/** Says that what was played stays in this browser, and offers to forget it after a second look. */
export function KeptNote({ persistent, question, onClear }: KeptNoteProps) {
  const [asking, setAsking] = useState(false);
  return (
    <span className="kept">
      {persistent ? "Kept in this browser only" : "Kept until you close this page"}
      {asking ? (
        <>
          <span>{question}</span>
          <button
            type="button"
            className="link"
            onClick={() => {
              setAsking(false);
              onClear();
            }}
          >
            Forget
          </button>
          <button type="button" className="link" onClick={() => setAsking(false)}>
            Keep
          </button>
        </>
      ) : (
        <button type="button" className="link" onClick={() => setAsking(true)}>
          Clear
        </button>
      )}
    </span>
  );
}
