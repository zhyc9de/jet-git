import { Allotment } from "allotment";
import { useEffect } from "react";
import "allotment/dist/style.css";
import { usePreventSelect } from "../shared/hooks/usePreventSelect";
import { usePanelStore } from "../shared/store/panel-store";
import { BranchTree } from "./components/BranchTree";
import { DetailPanel } from "./components/DetailPanel";
import { GitGraphPanel } from "./components/GitGraphPanel";
import { Toolbar } from "./components/Toolbar";

export function PanelApp() {
  const loading = usePanelStore((s) => s.loading);
  const commits = usePanelStore((s) => s.commits);
  const fetchInitialData = usePanelStore((s) => s.fetchInitialData);

  const middleRef = usePreventSelect();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  if (loading && commits.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          opacity: 0.5,
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Allotment>
        <Allotment.Pane preferredSize="15%" minSize={140}>
          <BranchTree />
        </Allotment.Pane>
        <Allotment.Pane minSize={400}>
          <div
            ref={middleRef}
            style={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            <Toolbar />
            <GitGraphPanel />
          </div>
        </Allotment.Pane>
        <Allotment.Pane preferredSize="30%" minSize={250}>
          <DetailPanel />
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}
