// ------ src/App.tsx ------
import { Card } from "./components/ui";
import { FlowCanvas } from "./components/flow/FlowCanvas";
import { SidebarPanel } from "./components/panels/SidebarPanel";

export default function InteractiveFilmFlow() {
  return (
    <div className="w-screen h-screen grid grid-cols-[1fr_400px] gap-3 p-3 bg-zinc-50">
      <Card className="relative overflow-hidden">
        <FlowCanvas />
      </Card>
      <SidebarPanel />
    </div>
  );
}
