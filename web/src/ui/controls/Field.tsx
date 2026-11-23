import { useState, type ReactNode } from "react";
import { settledNumber, typedNumber } from "./numberDraft";

interface LabelledProps {
  label: string;
  /** Label beside the control, not above it. */
  inline?: boolean;
  children: ReactNode;
}

/** A control under or beside its label. */
function Labelled({ label, inline = false, children }: LabelledProps) {
  return (
    <label className={inline ? "labelled-inline" : "labelled"}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

type Choice = string | number;

/** A choice with a text of its own. A bare value is shown as it is. */
export interface SelectOption<T extends Choice> {
  value: T;
  label: string;
}

interface SelectProps<T extends Choice> {
  label: string;
  value: T;
  options: readonly (T | SelectOption<T>)[];
  onChange: (value: T) => void;
  inline?: boolean;
  /** The label is read by screen readers only, as where the words around the control say what it is. */
  labelHidden?: boolean;
  /** Replaces the look of a field, as in a line that reads like a sentence. */
  className?: string;
}

const optionOf = <T extends Choice>(option: T | SelectOption<T>): SelectOption<T> =>
  typeof option === "object" ? option : { value: option, label: String(option) };

/** One choice from a list, under, beside or without a visible label. */
export function Select<T extends Choice>({
  label,
  value,
  options,
  onChange,
  inline,
  labelHidden = false,
  className = "field",
}: SelectProps<T>) {
  const choices = options.map(optionOf);
  const select = (
    <select
      className={className}
      aria-label={labelHidden ? label : undefined}
      value={value}
      onChange={(event) => {
        const chosen = choices.find((choice) => String(choice.value) === event.target.value);
        if (chosen !== undefined) onChange(chosen.value);
      }}
    >
      {choices.map((choice) => (
        <option key={choice.value} value={choice.value}>
          {choice.label}
        </option>
      ))}
    </select>
  );
  if (labelHidden) return select;
  return (
    <Labelled label={label} inline={inline}>
      {select}
    </Labelled>
  );
}

interface NumberInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  inline?: boolean;
}

/**
 * A whole number. What is typed stays as typed and is passed on while it is a number within the bounds.
 * Leaving the field or pressing Enter brings it within the bounds, and an emptied field back to its last value.
 */
export function NumberInput({ label, value, min, max, onChange, inline }: NumberInputProps) {
  /** The text being typed, null while the field shows its value. */
  const [draft, setDraft] = useState<string | null>(null);

  const type = (text: string) => {
    setDraft(text);
    const typed = typedNumber(text, min, max);
    if (typed !== null && typed !== value) onChange(typed);
  };
  const settle = () => {
    if (draft === null) return;
    const settled = settledNumber(draft, value, min, max);
    setDraft(null);
    if (settled !== value) onChange(settled);
  };

  return (
    <Labelled label={label} inline={inline}>
      <input
        className="field field-num num"
        type="number"
        inputMode="numeric"
        value={draft ?? value}
        min={min}
        max={max}
        onChange={(event) => type(event.target.value)}
        onBlur={settle}
        onKeyDown={(event) => {
          if (event.key === "Enter") settle();
        }}
      />
    </Labelled>
  );
}
