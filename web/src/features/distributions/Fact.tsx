import { cellName, type Point } from "@/game/board";

/** One number about a map under its label, with the cell it belongs to when there is one. */
export function Fact({ label, value, where }: { label: string; value: string; where?: Point }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd>
        {value}
        {where !== undefined && <span className="dist-fact-where">{cellName(where.x, where.y)}</span>}
      </dd>
    </div>
  );
}
