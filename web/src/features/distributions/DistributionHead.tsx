import type { ReactNode } from "react";
import { Pill } from "@/ui/controls/Pill";

interface DistributionHeadProps {
  busy: boolean;
  /** The choice between the two maps. */
  tabs: ReactNode;
}

/** The line the view opens with: its name, whether the engine is at work, and the choice of map. */
export function DistributionHead({ busy, tabs }: DistributionHeadProps) {
  return (
    <div className="head">
      <div className="head-lead">
        <h1>Distributions</h1>
        <span role="status">{busy && <Pill tone="live">Computing</Pill>}</span>
      </div>
      <div className="head-actions">{tabs}</div>
    </div>
  );
}
