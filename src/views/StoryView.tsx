// src/views/StoryView.tsx - REFACTORED
import React from 'react';
import { FlowCanvas } from '@/modules/flow/FlowCanvas';
import { GitBranch, Info } from 'lucide-react';
import { 
  Panel, 
  PanelHeader, 
  PanelContent,
  Card,
  FlexContainer,
  EmptyState,
  StatusText
} from '@/components/ui';

// Komponent legendy
const FlowLegend: React.FC = () => (
  <FlexContainer direction="col" className="space-y-2 mt-4">
    <FlexContainer className="items-center gap-2">
      <div className="w-3 h-3 bg-zinc-800 border border-zinc-700"></div>
      <StatusText variant="muted" size="xs">Scene nodes</StatusText>
    </FlexContainer>
    <FlexContainer className="items-center gap-2">
      <div className="w-3 h-3 bg-zinc-700 border border-zinc-600"></div>
      <StatusText variant="muted" size="xs">Choice nodes</StatusText>
    </FlexContainer>
    <FlexContainer className="items-center gap-2">
      <div className="w-8 h-0.5 bg-orange-500"></div>
      <StatusText variant="muted" size="xs">Conditional paths</StatusText>
    </FlexContainer>
  </FlexContainer>
);

export const StoryView: React.FC = () => {
  return (
    <FlexContainer direction="row" fullHeight>
      {/* Main Canvas */}
      <FlexContainer flex direction="col" className="bg-zinc-950">
        <Panel className="flex-1">
          <FlowCanvas showSceneCovers />
        </Panel>
      </FlexContainer>

      {/* Right Panel */}
      <Panel className="w-[350px] border-l border-zinc-800">
        <PanelHeader title="Story Overview"  />
        
        <PanelContent>
          <EmptyState
            icon={<GitBranch className="w-12 h-12 text-zinc-600" />}
            title="Story flow visualization"
            action={
              <Card compact>
                <FlexContainer className="items-start gap-2 mb-3">
                  <Info className="w-4 h-4 text-zinc-500 mt-0.5" />
                  <StatusText variant="muted" size="xs" className="leading-relaxed">
                    This view shows your complete story structure. Add scenes and choices to build branching narratives.
                  </StatusText>
                </FlexContainer>
                
                <FlowLegend />
              </Card>
            }
          />
        </PanelContent>
      </Panel>
    </FlexContainer>
  );
};