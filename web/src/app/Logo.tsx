/** The mark of the app: the eight-ray star of a compass rose. The favicon is the same drawing. */
export function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" fillRule="evenodd" aria-hidden="true">
      <path d="M10 .5l.99 7.1 3.39-1.98-1.98 3.39 7.1.99-7.1.99 1.98 3.39-3.39-1.98L10 19.5l-.99-7.1-3.39 1.98 1.98-3.39L.5 10l7.1-.99-1.98-3.39 3.39 1.98ZM10 8.3a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 1 0 0-3.4Z" />
    </svg>
  );
}
