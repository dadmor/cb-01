// src/modules/flow/nodes/SceneNode.tsx
import React, { useMemo, useRef, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { SceneNodeData } from "../types";
import { cn } from "@/lib/utils";
import { useVariablesStore } from "@/modules/variables/store/useVariablesStore";
import { evalConditions, conditionLabel } from "@/modules/variables/logic";
import { Lock, Paperclip, X, Film, Star } from "lucide-react";
import { useFlowStore } from "../store/useFlowStore";
import { VideoStorageService } from "@/modules/video/services/VideoStorageService";
import { useNavigate } from "react-router-dom";

interface SceneNodeProps {
  id: string;
  data: SceneNodeData;
  selected?: boolean;
}

export const SceneNode: React.FC<SceneNodeProps> = ({ id, data, selected }) => {
  const { label, description, durationSec, conditions, videoId } = data;
  const variables = useVariablesStore((s) => s.variables);
  const updateNode = useFlowStore((s) => s.updateNode);
  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isUnlocked = useMemo(
    () => evalConditions(conditions, variables),
    [conditions, variables]
  );

  const attachVideo = async (file: File) => {
    setBusy(true);
    try {
      const storage = VideoStorageService.getInstance();
      await storage.initialize();
      const vidId = await storage.storeVideo(file);
      updateNode(id, { videoId: vidId });
    } finally {
      setBusy(false);
    }
  };

  // Navigate to video view with scene pre-selected
  const handleNavigateToVideo = () => {
    navigate("/video", {
      state: {
        sceneId: id,
        videoId: videoId,
      },
    });
  };

  return (
    <div
      className={cn(
        "relative w-60 h-60 transition-all duration-150 ease-in-out",
        "border-2 bg-zinc-800",
        selected ? "border-red-500" : "border-zinc-700",
        !isUnlocked && "opacity-60"
      )}
    >
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-1 text-xs text-zinc-300">
            <Lock className="w-5 h-5 text-zinc-400" />
            {conditions?.map((c, i) => (
              <span key={i} className="font-mono">
                {conditionLabel(c)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-200">{label}</h3>

          {/* Video attachment UI */}
          <div className="flex items-center gap-1">
            {/* ⭐ priorytet */}
            {data.isPriority && (
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            )}
            {videoId ? (
              <span
                onClick={handleNavigateToVideo}
                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-200 cursor-pointer hover:bg-zinc-600"
              >
                <Film className="w-3 h-3" />
                <span>{busy ? "..." : "attached"}</span>
                <button
                  type="button"
                  title="Unlink video"
                  className="ml-1 opacity-70 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateNode(id, { videoId: undefined });
                  }}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ) : (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) attachVideo(f);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                />
                <button
                  type="button"
                  title="Attach video or go to video view"
                  className={cn(
                    "p-1 rounded border border-zinc-700 hover:bg-zinc-700/50",
                    "text-zinc-300"
                  )}
                  onClick={handleNavigateToVideo}
                  disabled={busy}
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 mb-3">
          {description && (
            <p className="text-xs leading-relaxed text-zinc-500 overflow-hidden text-ellipsis line-clamp-6">
              {description}
            </p>
          )}
        </div>

        <div className="mt-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-zinc-500">
              {videoId ? "Video" : "Duration"}
            </span>
            <span className="text-xs text-zinc-300 font-mono">
              {videoId ? "auto" : `${durationSec}s`}
            </span>
          </div>
          <div className="h-1 bg-zinc-900 relative overflow-hidden rounded-sm" />
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-4 !bg-zinc-700 !border !border-zinc-600 !rounded-none !left-[-5px]"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-4 !bg-zinc-700 !border !border-zinc-600 !rounded-none !right-[-5px]"
      />
    </div>
  );
};
