import { useEffect } from "react";
import { api } from "@/data/api/client";
import { Waiting } from "@/ui/controls/Waiting";
import { CatalogueContext } from "@/data/api/catalogue";
import { shownData, useLoad } from "@/lib/useAsync";
import { useEngineStatus } from "@/data/engine/useEngineStatus";
import { useRoute, type Navigation } from "./useRoute";
import { EngineError } from "./EngineError";
import { TopBar } from "./TopBar";
import { titleOf } from "./viewLabel";
import { ArenaView } from "@/features/arena/ArenaView";
import { DistributionsView } from "@/features/distributions/DistributionsView";
import { HomeView } from "@/features/home/HomeView";
import { PlayView } from "@/features/play/PlayView";
import { ReplayView } from "@/features/replay/ReplayView";

/** The views that need the catalogue of the engine. Home is shown without it. */
function EngineView(navigation: Navigation) {
  switch (navigation.route.view) {
    case "play":
      return <PlayView />;
    case "replay":
      return <ReplayView {...navigation} />;
    case "arena":
      return <ArenaView {...navigation} />;
    case "distributions":
      return <DistributionsView />;
    case "home":
      return null;
  }
}

/** The frame of the app: the top bar, the engine coming up or failing, and the view named by the hash. */
export function App() {
  const navigation = useRoute();
  const { view } = navigation.route;
  const catalogue = useLoad(api.catalogue, []);
  const engine = useEngineStatus();
  const failure =
    engine.state === "failed" ? engine.message : catalogue.state.status === "error" ? catalogue.state.message : null;

  // Newer browsers answer a scroll with a promise, which an effect must not return.
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = titleOf(view);
  }, [view]);

  return (
    <>
      <TopBar current={view} />
      <main className="page">
        {failure !== null ? (
          <EngineError detail={failure} />
        ) : view === "home" ? (
          <HomeView catalogue={shownData(catalogue.state)} />
        ) : catalogue.state.status === "ready" ? (
          <CatalogueContext.Provider value={catalogue.state.data}>
            <EngineView {...navigation} />
          </CatalogueContext.Provider>
        ) : (
          <Waiting>Loading the game engine</Waiting>
        )}
      </main>
    </>
  );
}
