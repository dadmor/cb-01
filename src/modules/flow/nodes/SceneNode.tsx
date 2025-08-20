import React from "react";
import { Handle, Position } from "reactflow";
import { SceneNodeData } from "@/types";

interface SceneNodeProps {
  data: SceneNodeData;
  selected?: boolean;
}

export const SceneNode: React.FC<SceneNodeProps> = ({ data, selected }) => {
  const { label, description, isUnlocked = true, isCurrent, remainingMs, videoSegmentId } = data;
  
  return (
    <div 
      className={`
        w-64 min-h-24 p-3 rounded-lg shadow-md border-2 transition-all
        ${isCurrent 
          ? "border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-300" 
          : selected 
          ? "border-zinc-700 bg-white" 
          : isUnlocked 
          ? "border-zinc-300 bg-white" 
          : "border-red-300 bg-red-50 opacity-75"
        }
      `}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-zinc-400" 
      />
      
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-medium text-sm flex-1 truncate">
          {label}
          {!isUnlocked && " 🔒"}
        </h3>
        
        {remainingMs !== undefined && remainingMs > 0 && (
          <span className="text-xs bg-blue-100 px-2 py-0.5 rounded">
            {Math.ceil(remainingMs / 1000)}s
          </span>
        )}
        
        {videoSegmentId && !remainingMs && (
          <span className="text-xs text-zinc-500">📹</span>
        )}
      </div>
      
      {description && (
        <p className="text-xs text-zinc-600 line-clamp-2">{description}</p>
      )}
      
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-zinc-400" 
      />
    </div>
  );
};