// src/views/StorymapView.tsx
import React from "react";
import { FlowCanvas } from "@/modules/flow/FlowCanvas";
import { StorymapSidebar } from "./storymap/StorymapSidebar";
import { Panel, PanelHeader } from "@/components/ui";

export const StorymapView: React.FC = () => {
  return (
    <div className="flex h-full">
      {/* Main Canvas */}
      <div className="flex-1 bg-zinc-900">
        <FlowCanvas />
      </div>

      {/* Right Panel - Inspector/Decisions */}
      <Panel className="w-96 border-l border-zinc-800">
        <PanelHeader title="Inspector" />
        <StorymapSidebar />
      </Panel>
    </div>
  );
};