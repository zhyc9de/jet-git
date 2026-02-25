import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConflictsApp } from "./conflicts/App";
import { MergeStandaloneApp } from "./conflicts/MergeStandaloneApp";
import { PanelApp } from "./panel/App";
import "./shared/theme/variables.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");
const mode = root.dataset.mode as "panel" | "merge" | "conflicts" | undefined;

createRoot(root).render(
  <StrictMode>
    {mode === "merge" ? (
      <MergeStandaloneApp />
    ) : mode === "conflicts" ? (
      <ConflictsApp />
    ) : (
      <PanelApp />
    )}
  </StrictMode>,
);
