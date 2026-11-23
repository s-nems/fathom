export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface SegmentedProps<T extends string | number> {
  /** Read by screen readers as the name of the group. */
  label: string;
  value: T | undefined;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}

/** A small set of exclusive choices shown side by side. */
export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  className,
}: SegmentedProps<T>) {
  return (
    <div className={className ? `seg ${className}` : "seg"} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
