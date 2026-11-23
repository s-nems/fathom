import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles/tokens.css";
import "./styles/base.css";
import "./ui/controls/controls.css";
import "./ui/board/board.css";
import "./app/shell.css";
import "./features/replay/replay.css";
import "./features/home/home.css";
import "./features/play/play.css";
import "./features/arena/arena.css";
import "./features/distributions/distributions.css";

const root = document.getElementById("root");
if (root === null) throw new Error("The page has no root element.");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
