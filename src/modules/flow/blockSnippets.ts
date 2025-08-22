// src/modules/flow/blockSnippets.ts

import { SceneNode, ChoiceNode, StoryEdge } from "@/types";
import { snapPositionToGrid } from "./gridHelpers";

export interface BlockSnippet {
  id: string;
  name: string;
  description: string;
  icon: string;
  create: (sourceNodeId: string, position: { x: number; y: number }) => {
    nodes: (SceneNode | ChoiceNode)[];
    edges: StoryEdge[];
  };
}

let nextId = 1000;

const generateId = (type: string) => `${type}-${nextId++}`;

export const blockSnippets: BlockSnippet[] = [
  {
    id: "single-scene",
    name: "New Scene",
    description: "Add a single scene connected to selected",
    icon: "📄",
    create: (sourceNodeId, position) => {
      const sceneId = generateId("scene");
      const choiceId = generateId("choice");
      
      return {
        nodes: [
          {
            id: choiceId,
            type: "choice",
            position: snapPositionToGrid({ x: position.x + 288, y: position.y + 96 }),
            data: { label: "Continue", effects: {} }
          },
          {
            id: sceneId,
            type: "scene",
            position: snapPositionToGrid({ x: position.x + 576, y: position.y }),
            data: { 
              label: "New Scene", 
              durationSec: 5 
            }
          }
        ],
        edges: [
          { id: `${sourceNodeId}-${choiceId}`, source: sourceNodeId, target: choiceId },
          { id: `${choiceId}-${sceneId}`, source: choiceId, target: sceneId }
        ]
      };
    }
  },
  
  {
    id: "scene-with-choice",
    name: "Scene → Choice",
    description: "Scene with a single choice leading to another scene",
    icon: "📄→🔀",
    create: (sourceNodeId, position) => {
      const sceneId1 = generateId("scene");
      const choiceId1 = generateId("choice");
      const choiceId2 = generateId("choice");
      const sceneId2 = generateId("scene");
      
      return {
        nodes: [
          {
            id: choiceId1,
            type: "choice",
            position: snapPositionToGrid({ x: position.x + 288, y: position.y + 96 }),
            data: { label: "To Scene A", effects: {} }
          },
          {
            id: sceneId1,
            type: "scene",
            position: snapPositionToGrid({ x: position.x + 576, y: position.y }),
            data: { label: "Scene A", durationSec: 5 }
          },
          {
            id: choiceId2,
            type: "choice",
            position: snapPositionToGrid({ x: position.x + 864, y: position.y + 96 }),
            data: { label: "Continue", effects: {} }
          },
          {
            id: sceneId2,
            type: "scene",
            position: snapPositionToGrid({ x: position.x + 1152, y: position.y }),
            data: { label: "Scene B", durationSec: 5 }
          }
        ],
        edges: [
          { id: `${sourceNodeId}-${choiceId1}`, source: sourceNodeId, target: choiceId1 },
          { id: `${choiceId1}-${sceneId1}`, source: choiceId1, target: sceneId1 },
          { id: `${sceneId1}-${choiceId2}`, source: sceneId1, target: choiceId2 },
          { id: `${choiceId2}-${sceneId2}`, source: choiceId2, target: sceneId2 }
        ]
      };
    }
  },
  
  {
    id: "binary-choice",
    name: "Binary Decision",
    description: "Two choices leading to different scenes",
    icon: "🔀↗↘",
    create: (sourceNodeId, position) => {
      const choiceId1 = generateId("choice");
      const choiceId2 = generateId("choice");
      const sceneId1 = generateId("scene");
      const sceneId2 = generateId("scene");
      
      return {
        nodes: [
          {
            id: choiceId1,
            type: "choice",
            position: snapPositionToGrid({ x: position.x + 312, y: position.y - 72 }),
            data: { label: "Option A", effects: {} }
          },
          {
            id: choiceId2,
            type: "choice",
            position: snapPositionToGrid({ x: position.x + 312, y: position.y + 264 }),
            data: { label: "Option B", effects: {} }
          },
          {
            id: sceneId1,
            type: "scene",
            position: snapPositionToGrid({ x: position.x + 600, y: position.y - 168 }),
            data: { label: "Result A", durationSec: 5 }
          },
          {
            id: sceneId2,
            type: "scene",
            position: snapPositionToGrid({ x: position.x + 600, y: position.y + 168 }),
            data: { label: "Result B", durationSec: 5 }
          }
        ],
        edges: [
          { id: `${sourceNodeId}-${choiceId1}`, source: sourceNodeId, target: choiceId1 },
          { id: `${sourceNodeId}-${choiceId2}`, source: sourceNodeId, target: choiceId2 },
          { id: `${choiceId1}-${sceneId1}`, source: choiceId1, target: sceneId1 },
          { id: `${choiceId2}-${sceneId2}`, source: choiceId2, target: sceneId2 }
        ]
      };
    }
  },
  
  {
    id: "triple-choice",
    name: "Triple Decision", 
    description: "Three choices branching from selected scene",
    icon: "🔀↗→↘",
    create: (sourceNodeId, position) => {
      const choices = [];
      const scenes = [];
      const edges = [];
      
      for (let i = 0; i < 3; i++) {
        const choiceId = generateId("choice");
        const sceneId = generateId("scene");
        const yOffset = (i - 1) * 192; // -192, 0, 192 (8 grid units)
        
        choices.push({
          id: choiceId,
          type: "choice" as const,
          position: snapPositionToGrid({ x: position.x + 312, y: position.y + 96 + yOffset }),
          data: { label: `Option ${i + 1}`, effects: {} }
        });
        
        scenes.push({
          id: sceneId,
          type: "scene" as const,
          position: snapPositionToGrid({ x: position.x + 600, y: position.y + yOffset }),
          data: { label: `Result ${i + 1}`, durationSec: 5 }
        });
        
        edges.push(
          { id: `${sourceNodeId}-${choiceId}`, source: sourceNodeId, target: choiceId },
          { id: `${choiceId}-${sceneId}`, source: choiceId, target: sceneId }
        );
      }
      
      return { nodes: [...choices, ...scenes], edges };
    }
  },
  
  {
    id: "conditional-branch",
    name: "Conditional Branch",
    description: "Scene with condition-based paths",
    icon: "🔒🔀",
    create: (sourceNodeId, position) => {
      const sceneId1 = generateId("scene");
      const choiceId1 = generateId("choice");
      const choiceId2 = generateId("choice");
      const choiceId3 = generateId("choice");
      const sceneId2 = generateId("scene");
      const sceneId3 = generateId("scene");
      
      return {
        nodes: [
          {
            id: choiceId1,
            type: "choice",
            position: snapPositionToGrid({ x: position.x + 288, y: position.y + 96 }),
            data: { label: "To Check Point", effects: {} }
          },
          {
            id: sceneId1,
            type: "scene",
            position: snapPositionToGrid({ x: position.x + 576, y: position.y }),
            data: { 
              label: "Check Point", 
              durationSec: 3,
              description: "Checks player stats"
            }
          },
          {
            id: choiceId2,
            type: "choice",
            position: snapPositionToGrid({ x: position.x + 864, y: position.y - 72 }),
            data: { 
              label: "High Path", 
              effects: { energy: -2 }
            }
          },
          {
            id: choiceId3,
            type: "choice",
            position: snapPositionToGrid({ x: position.x + 864, y: position.y + 264 }),
            data: { 
              label: "Low Path", 
              effects: { health: -1 }
            }
          },
          {
            id: sceneId2,
            type: "scene",
            position: snapPositionToGrid({ x: position.x + 1152, y: position.y - 168 }),
            data: { 
              label: "Success Route", 
              durationSec: 5,
              condition: { varName: "energy", op: "gte", value: 3 }
            }
          },
          {
            id: sceneId3,
            type: "scene",
            position: snapPositionToGrid({ x: position.x + 1152, y: position.y + 168 }),
            data: { 
              label: "Safe Route", 
              durationSec: 5 
            }
          }
        ],
        edges: [
          { id: `${sourceNodeId}-${choiceId1}`, source: sourceNodeId, target: choiceId1 },
          { id: `${choiceId1}-${sceneId1}`, source: choiceId1, target: sceneId1 },
          { id: `${sceneId1}-${choiceId2}`, source: sceneId1, target: choiceId2 },
          { id: `${sceneId1}-${choiceId3}`, source: sceneId1, target: choiceId3 },
          { id: `${choiceId2}-${sceneId2}`, source: choiceId2, target: sceneId2 },
          { id: `${choiceId3}-${sceneId3}`, source: choiceId3, target: sceneId3 }
        ]
      };
    }
  },
  
  {
    id: "converging-paths",
    name: "Converging Paths",
    description: "Multiple paths that merge back together",
    icon: "↗↘→",
    create: (sourceNodeId, position) => {
      const choiceId1 = generateId("choice");
      const choiceId2 = generateId("choice");
      const sceneId1 = generateId("scene");
      const sceneId2 = generateId("scene");
      const choiceId3 = generateId("choice");
      const choiceId4 = generateId("choice");
      const sceneIdFinal = generateId("scene");
      
      return {
        nodes: [
          // First branch
          {
            id: choiceId1,
            type: "choice",
            position: snapPositionToGrid({ x: position.x + 312, y: position.y - 72 }),
            data: { label: "Quick Route", effects: { energy: -3 } }
          },
          {
            id: sceneId1,
            type: "scene",
            position: snapPositionToGrid({ x: position.x + 600, y: position.y - 168 }),
            data: { label: "Shortcut", durationSec: 3 }
          },
          {
            id: choiceId3,
            type: "choice",
            position: snapPositionToGrid({ x: position.x + 888, y: position.y - 72 }),
            data: { label: "Merge", effects: {} }
          },
          
          // Second branch
          {
            id: choiceId2,
            type: "choice",
            position: snapPositionToGrid({ x: position.x + 312, y: position.y + 264 }),
            data: { label: "Scenic Route", effects: { energy: -1 } }
          },
          {
            id: sceneId2,
            type: "scene",
            position: snapPositionToGrid({ x: position.x + 600, y: position.y + 168 }),
            data: { label: "Long Path", durationSec: 6 }
          },
          {
            id: choiceId4,
            type: "choice",
            position: snapPositionToGrid({ x: position.x + 888, y: position.y + 264 }),
            data: { label: "Merge", effects: {} }
          },
          
          // Converged path
          {
            id: sceneIdFinal,
            type: "scene",
            position: snapPositionToGrid({ x: position.x + 1176, y: position.y }),
            data: { label: "Reunion Point", durationSec: 5 }
          }
        ],
        edges: [
          { id: `${sourceNodeId}-${choiceId1}`, source: sourceNodeId, target: choiceId1 },
          { id: `${sourceNodeId}-${choiceId2}`, source: sourceNodeId, target: choiceId2 },
          { id: `${choiceId1}-${sceneId1}`, source: choiceId1, target: sceneId1 },
          { id: `${choiceId2}-${sceneId2}`, source: choiceId2, target: sceneId2 },
          { id: `${sceneId1}-${choiceId3}`, source: sceneId1, target: choiceId3 },
          { id: `${sceneId2}-${choiceId4}`, source: sceneId2, target: choiceId4 },
          { id: `${choiceId3}-${sceneIdFinal}`, source: choiceId3, target: sceneIdFinal },
          { id: `${choiceId4}-${sceneIdFinal}`, source: choiceId4, target: sceneIdFinal }
        ]
      };
    }
  }
];

// Auto-layout helper
export const autoLayout = (nodes: (SceneNode | ChoiceNode)[], edges: StoryEdge[]) => {
  // Simple force-directed layout simulation
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const iterations = 50;
  const springLength = 336; // 14 grid units
  const springStrength = 0.1;
  const repulsionStrength = 20000;
  
  for (let i = 0; i < iterations; i++) {
    // Apply spring forces for connected nodes
    edges.forEach(edge => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) return;
      
      const dx = target.position.x - source.position.x;
      const dy = target.position.y - source.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const force = (distance - springLength) * springStrength;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        source.position.x += fx;
        source.position.y += fy;
        target.position.x -= fx;
        target.position.y -= fy;
      }
    });
    
    // Apply repulsion forces between all nodes
    nodes.forEach((n1, i) => {
      nodes.forEach((n2, j) => {
        if (i >= j) return;
        
        const dx = n2.position.x - n1.position.x;
        const dy = n2.position.y - n1.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0 && distance < 480) { // 20 grid units
          const force = repulsionStrength / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          n1.position.x -= fx;
          n1.position.y -= fy;
          n2.position.x += fx;
          n2.position.y += fy;
        }
      });
    });
  }
  
  // Snap final positions to grid
  nodes.forEach(node => {
    node.position = snapPositionToGrid(node.position);
  });
  
  return nodes;
};