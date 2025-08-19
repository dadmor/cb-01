import { useGameStore, VARIABLES } from "@/gameStore";
import { useCallback, useEffect, useRef, useState } from "react";


export function useIsNodeUnlocked() {
  const variables = useGameStore((s) => s.variables);
  return useCallback((node) => {
    if (node.type === "decision") return true;
    return VARIABLES.evaluate(variables, node.data.condition);
  }, [variables]);
}

export function useTraverseDecision(nodes: any[], edges: any[]) {
  const mode = useGameStore((s) => s.mode);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const setVariables = useGameStore((s) => s.setVariables);
  const setCurrentNode = useGameStore((s) => s.setCurrentNode);

  return useCallback((decisionNodeId: string) => {
    if (mode === "edit" || isGameOver) return;
    
    const decisionNode = nodes.find(n => n.id === decisionNodeId);
    if (!decisionNode) return;
    
    // Find the edge from decision to target
    const outgoingEdge = edges.find(e => e.source === decisionNodeId);
    if (!outgoingEdge) return;
    
    const targetNode = nodes.find(n => n.id === outgoingEdge.target);
    if (!targetNode) return;
    
    setVariables((prev) => {
      const next = VARIABLES.applyDeltas(prev, decisionNode.data.deltas);
      if (VARIABLES.evaluate(next, targetNode.data.condition)) {
        setCurrentNode(targetNode.id, decisionNode.data.label || "decyzja");
      }
      return next;
    });
  }, [mode, isGameOver, nodes, edges, setVariables, setCurrentNode]);
}

export function useNodeRuntime(currentNode: any, nodes: any[], edges: any[]) {
  const mode = useGameStore((s) => s.mode);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const setGameOver = useGameStore((s) => s.setGameOver);
  const traverseDecision = useTraverseDecision(nodes, edges);
  const isNodeUnlocked = useIsNodeUnlocked();
  const [remainingMs, setRemainingMs] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const clear = () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    };

    clear();
    setRemainingMs(0);
    if (mode !== "play" || isGameOver || !currentNode || currentNode.type === "decision") return;

    const durSec = currentNode.data.durationSec ?? 0;
    
    // Find decision nodes connected to current node
    const outgoingEdges = edges.filter(e => e.source === currentNode.id);
    const decisionNodes = outgoingEdges.map(e => nodes.find(n => n.id === e.target)).filter(Boolean);
    
    if (!durSec || durSec <= 0) {
      // Immediate decision or end node
      if (decisionNodes.length === 0) {
        setGameOver(true);
      } else if (currentNode.data.defaultDecisionId) {
        const defaultDecision = decisionNodes.find(d => d.id === currentNode.data.defaultDecisionId);
        if (defaultDecision) {
          const targetEdge = edges.find(e => e.source === defaultDecision.id);
          const targetNode = targetEdge ? nodes.find(n => n.id === targetEdge.target) : null;
          if (targetNode && isNodeUnlocked(targetNode)) {
            setTimeout(() => traverseDecision(defaultDecision.id), 100);
          } else {
            setGameOver(true);
          }
        }
      }
      return () => clear();
    }

    // Timed node
    const total = durSec * 1000;
    const start = performance.now();
    setRemainingMs(total);
    
    intervalRef.current = setInterval(() => {
      const elapsed = performance.now() - start;
      const left = Math.max(0, Math.round(total - elapsed));
      setRemainingMs(left);
    }, 100);

    timeoutRef.current = setTimeout(() => {
      if (currentNode.data.defaultDecisionId) {
        const defaultDecision = decisionNodes.find(d => d.id === currentNode.data.defaultDecisionId);
        if (defaultDecision) {
          const targetEdge = edges.find(e => e.source === defaultDecision.id);
          const targetNode = targetEdge ? nodes.find(n => n.id === targetEdge.target) : null;
          if (targetNode && isNodeUnlocked(targetNode)) {
            traverseDecision(defaultDecision.id);
          } else {
            setGameOver(true);
          }
        } else {
          setGameOver(true);
        }
      } else {
        setGameOver(true);
      }
    }, total);

    return () => clear();
  }, [mode, isGameOver, currentNode, nodes, edges, traverseDecision, isNodeUnlocked, setGameOver]);

  return { remainingMs };
}