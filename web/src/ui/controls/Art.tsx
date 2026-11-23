import lighthouse from "@/assets/art/lighthouse.webp";
import sextant from "@/assets/art/sextant.webp";
import ship from "@/assets/art/ship.webp";
import wreck from "@/assets/art/wreck.webp";

/** The engravings of the app with their sizes in pixels, so that the page does not jump when one loads. */
const PIECES = {
  lighthouse: { src: lighthouse, width: 520, height: 496 },
  sextant: { src: sextant, width: 420, height: 359 },
  ship: { src: ship, width: 520, height: 214 },
  wreck: { src: wreck, width: 460, height: 463 },
} as const;

export type ArtPiece = keyof typeof PIECES;

/** A decorative engraving. It says nothing a screen reader needs. */
export function Art({ piece, className }: { piece: ArtPiece; className?: string }) {
  return <img className={className ? `art ${className}` : "art"} alt="" {...PIECES[piece]} />;
}
