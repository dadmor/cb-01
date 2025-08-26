// src/views/StorymapView.tsx - REFACTORED
import React from "react";
import { FlowCanvas } from "@/modules/flow/FlowCanvas";
import { StorymapSidebar } from "./storymap/StorymapSidebar";
import { FlexContainer, Panel, PanelHeader, CanvasContainer } from "@/components/ui";

export const StorymapView: React.FC = () => {
  return (
    <FlexContainer direction="row" fullHeight>
      {/* Main Canvas */}
      <FlexContainer flex direction="col" className="bg-zinc-900">
        <CanvasContainer>
          <FlowCanvas />
        </CanvasContainer>
      </FlexContainer>

      {/* Right Panel - Inspector/Decisions */}
      <Panel className="w-96">
        <PanelHeader title="INSPECTOR" compact />
        <StorymapSidebar />
      </Panel>
    </FlexContainer>
  );
};