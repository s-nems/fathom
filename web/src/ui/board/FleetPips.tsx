const PIP_CELL_PX = 4;

interface FleetPipsProps {
  /** The sizes of the ships of a fleet. */
  fleet: number[];
  /** The sizes of the ships lost. */
  sunk: number[];
}

/** A fleet as small bars in the lengths of its ships, the lost ones marked. */
export function FleetPips({ fleet, sunk }: FleetPipsProps) {
  const lost = [...sunk];
  const pips = [...fleet]
    .sort((a, b) => b - a)
    .map((size) => {
      const at = lost.indexOf(size);
      if (at >= 0) lost.splice(at, 1);
      return { size, gone: at >= 0 };
    });
  return (
    <div className="pips" role="img" aria-label={`${sunk.length} of ${fleet.length} ships sunk`}>
      {pips.map((pip, index) => (
        <i key={index} className={pip.gone ? "gone" : undefined} style={{ width: pip.size * PIP_CELL_PX }} />
      ))}
    </div>
  );
}
