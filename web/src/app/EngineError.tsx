import { Art } from "@/ui/controls/Art";
import { Button } from "@/ui/controls/Button";

/** The engine did not start. Nothing works without it, so this takes the place of every view. */
export function EngineError({ detail }: { detail: string }) {
  return (
    <div className="engine-error" role="alert">
      <Art piece="lighthouse" className="engine-error-art" />
      <h1>The game engine could not start</h1>
      <p>Nothing here works without it.</p>
      <Button variant="primary" onClick={() => window.location.reload()}>
        Try again
      </Button>
      <span className="engine-error-detail">{detail}</span>
    </div>
  );
}
