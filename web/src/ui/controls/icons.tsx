const SIZE = { width: 14, height: 14, viewBox: "0 0 14 14", "aria-hidden": true } as const;

export function PlayIcon() {
  return (
    <svg {...SIZE} fill="currentColor">
      <path d="M3.5 1.5v11l9-5.5z" />
    </svg>
  );
}

export function PauseIcon() {
  return (
    <svg {...SIZE} fill="currentColor">
      <path d="M3 2h3v10H3zM8 2h3v10H8z" />
    </svg>
  );
}

/** A chevron: forward, or back when asked. */
export function StepIcon({ back = false }: { back?: boolean }) {
  return (
    <svg {...SIZE} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={back ? "M9 2.5 4.5 7 9 11.5" : "M5 2.5 9.5 7 5 11.5"} />
    </svg>
  );
}
