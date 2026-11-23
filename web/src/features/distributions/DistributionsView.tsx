import { useState } from "react";
import { Segmented, type SegmentedOption } from "@/ui/controls/Segmented";
import { DistributionHead } from "./DistributionHead";
import { LayoutHeat } from "./LayoutHeat";
import { ShooterHeat } from "./ShooterHeat";

type MapKind = "layout" | "shooter";

const KINDS: readonly SegmentedOption<MapKind>[] = [
  { value: "layout", label: "Where ships go" },
  { value: "shooter", label: "Where shots go" },
];

/**
 * Heat maps of what a layout source or a shooter does over many fleets or games. A map is computed when it
 * is first opened and then kept, so that going back and forth asks the engine nothing. The head is the one
 * of the view, so the switch between the maps stays where it is and keeps the focus.
 */
export function DistributionsView() {
  const [kind, setKind] = useState<MapKind>("layout");
  const [shooterOpened, setShooterOpened] = useState(false);
  const [layoutBusy, setLayoutBusy] = useState(false);
  const [shooterBusy, setShooterBusy] = useState(false);
  const choose = (chosen: MapKind) => {
    setKind(chosen);
    if (chosen === "shooter") setShooterOpened(true);
  };
  return (
    <div className="dist-view">
      <DistributionHead
        busy={kind === "layout" ? layoutBusy : shooterBusy}
        tabs={<Segmented label="Map" value={kind} options={KINDS} onChange={choose} />}
      />
      <div hidden={kind !== "layout"}>
        <LayoutHeat onBusy={setLayoutBusy} />
      </div>
      {shooterOpened && (
        <div hidden={kind !== "shooter"}>
          <ShooterHeat onBusy={setShooterBusy} />
        </div>
      )}
    </div>
  );
}
