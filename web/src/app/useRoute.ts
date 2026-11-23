import { useCallback, useEffect, useState } from "react";
import { hrefOf, parseHash, type Route, type ViewId } from "./route";

export interface Navigation {
  route: Route;
  /** Opens a view with exactly these parameters. Empty values are left out. */
  navigate: (view: ViewId, params?: Record<string, string | undefined>) => void;
}

export function useRoute(): Navigation {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const navigate = useCallback<Navigation["navigate"]>((view, params = {}) => {
    window.location.hash = hrefOf(view, params);
  }, []);

  return { route, navigate };
}
