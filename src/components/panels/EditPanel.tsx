import React from "react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "../ui";
import { NodeEditor } from "./NodeEditor";
import { VariablesSection } from "./VariablesSection";


interface EditPanelProps {
  selectedNode: any;
  nodes: any[];
  edges: any[];
  onAddMainNode: () => void;
  onDeleteNode: () => void;
  onUpdateNode: (nodeId: string, data: any) => void;
}

export const EditPanel: React.FC<EditPanelProps> = ({
  selectedNode,
  nodes,
  edges,
  onAddMainNode,
  onDeleteNode,
  onUpdateNode,
}) => {
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="border-b">
        <CardTitle className="text-base">Tryb edycji</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto space-y-4 p-4">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={onAddMainNode}
            className="flex-1"
          >
            + Nowy blok główny
          </Button>
          {selectedNode && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onDeleteNode}
              disabled={selectedNode.id === "main-1"}
            >
              Usuń
            </Button>
          )}
        </div>

        {selectedNode && (
          <NodeEditor
            node={selectedNode}
            nodes={nodes}
            edges={edges}
            onUpdate={(data) => onUpdateNode(selectedNode.id, data)}
          />
        )}

        <VariablesSection />
      </CardContent>
    </Card>
  );
};