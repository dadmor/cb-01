import React from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Label } from "../ui";
import { useGameStore } from "@/gameStore";
import { VariablesSection } from "./VariablesSection";


interface GamePanelProps {
  currentNode: any;
  currentDecisions: any[];
  remainingMs: number;
  onStartPlay: () => void;
  onReset: () => void;
}

export const GamePanel: React.FC<GamePanelProps> = ({
  currentNode,
  currentDecisions,
  remainingMs,
  onStartPlay,
  onReset,
}) => {
  const mode = useGameStore((s) => s.mode);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const stopPlay = useGameStore((s) => s.stopPlay);

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {mode === "edit" ? "Tryb edycji" : "Tryb gry"}
            {mode === "play" && isGameOver && <Badge variant="destructive" className="ml-2">Koniec gry</Badge>}
          </CardTitle>
          <div className="flex gap-2">
            {mode === "edit" ? (
              <Button size="sm" onClick={onStartPlay}>Start gry</Button>
            ) : (
              <>
                <Button size="sm" variant="secondary" onClick={onReset}>Reset</Button>
                <Button size="sm" variant="outline" onClick={stopPlay}>Zakończ</Button>
              </>
            )}
          </div>
        </div>
        {currentNode && (
          <div className="text-sm text-zinc-500">
            {currentNode.data.label}
            {mode === "play" && (currentNode.data.durationSec ?? 0) > 0 && (
              <Badge variant="secondary" className="ml-2">{Math.ceil(remainingMs / 1000)}s</Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-auto space-y-4 p-4">
        {mode === "play" && !isGameOver && currentNode?.type === "main" && (
          <div className="space-y-2">
            <Label>Dostępne decyzje</Label>
            {currentDecisions.length === 0 ? (
              <p className="text-sm text-zinc-500">Brak dostępnych decyzji - koniec gry</p>
            ) : (
              <p className="text-sm text-zinc-500">
                Kliknij na decyzję w grafie aby kontynuować
              </p>
            )}
          </div>
        )}

        <VariablesSection />
      </CardContent>
    </Card>
  );
};