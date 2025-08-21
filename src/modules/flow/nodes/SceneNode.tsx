import React from "react";
import { Handle, Position } from "reactflow";
import { SceneNodeData } from "@/types";
import { useVideoStore } from "@/modules/video/store";

interface SceneNodeProps {
  data: SceneNodeData;
  selected?: boolean;
}

export const SceneNode: React.FC<SceneNodeProps> = ({ data, selected }) => {
  const { 
    label, 
    description, 
    isUnlocked = true, 
    isCurrent, 
    remainingMs, 
    videoSegmentId,
    durationSec 
  } = data;
  
  const segments = useVideoStore(state => state.segments);
  const videoSegment = segments.find(s => s.id === videoSegmentId);
  
  const progress = remainingMs !== undefined && durationSec > 0
    ? ((durationSec * 1000 - remainingMs) / (durationSec * 1000)) * 100
    : 0;

  return (
    <div 
      className={`
        relative w-72 min-h-32 rounded-xl shadow-lg transition-all duration-200
        ${isCurrent 
          ? "ring-2 ring-zinc-700 ring-offset-2 ring-offset-black" 
          : selected 
          ? "ring-2 ring-zinc-800 ring-offset-2 ring-offset-black" 
          : ""
        }
        ${!isUnlocked ? "opacity-50" : ""}
      `}
    >
      <div className={`
        absolute inset-0 rounded-xl
        ${isCurrent 
          ? "bg-zinc-800" 
          : isUnlocked 
          ? "bg-zinc-900" 
          : "bg-black"
        }
      `} />
      
      <div className="relative p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className={`
              font-semibold text-base leading-tight
              ${isCurrent ? "text-zinc-100" : "text-zinc-300"}
            `}>
              {label}
              {!isUnlocked && " 🔒"}
            </h3>
            
            {videoSegment && (
              <div className="flex items-center gap-1 mt-1">
                <svg className="w-3 h-3 text-zinc-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                </svg>
                <span className="text-xs text-zinc-600">
                {(videoSegment as any).label || `Segment ${segments.indexOf(videoSegment) + 1}`}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {isCurrent && (
              <div className="w-2 h-2 bg-zinc-500 rounded-full" />
            )}
            
            {remainingMs !== undefined && remainingMs > 0 && (
              <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400 font-mono">
                {Math.ceil(remainingMs / 1000)}s
              </span>
            )}
          </div>
        </div>
        
        {description && (
          <p className={`
            text-xs leading-relaxed line-clamp-2 mb-2
            ${isCurrent ? "text-zinc-400" : "text-zinc-500"}
          `}>
            {description}
          </p>
        )}
        
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-zinc-600">
              Duration
            </span>
            <span className="font-mono text-zinc-500">
              {durationSec}s
            </span>
          </div>
          
          {isCurrent && remainingMs !== undefined ? (
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-zinc-600 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : (
            <div className="h-1 bg-zinc-800 rounded-full" />
          )}
        </div>
      </div>
      
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 border-2 bg-zinc-800 border-zinc-700"
        style={{ left: '-6px' }}
      />
      
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 border-2 bg-zinc-800 border-zinc-700"
        style={{ right: '-6px' }}
      />
      
      {!isUnlocked && (
        <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center">
          <div className="bg-zinc-900 rounded-lg px-3 py-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
            </svg>
            <span className="text-xs text-zinc-600 font-medium">Locked</span>
          </div>
        </div>
      )}
    </div>
  );
};