// ============================================
// src/modules/flow/nodes/SceneNode.tsx
// ============================================
import React, { useMemo, useRef, useState, useContext } from "react";
import { Handle, Position } from "@xyflow/react";
import { SceneNodeData } from "../types";
import { cn } from "@/lib/utils";
import { useVariablesStore } from "@/modules/variables/store/useVariablesStore";
import { evalConditions, conditionLabel } from "@/modules/variables/logic";
import { Lock, Paperclip, X, Film, Star } from "lucide-react";
import { useFlowStore } from "../store/useFlowStore";
import { useNavigate } from "react-router-dom";
import { FlowUIContext } from "../FlowCanvas";
import { useVideoStorage } from "@/modules/video/services/VideoStorageService";

interface SceneNodeProps {
  id: string;
  data: SceneNodeData;
  selected?: boolean;
}

export const SceneNode: React.FC<SceneNodeProps> = ({ id, data, selected }) => {
  const { label, description, conditions, videoId, isPriority } = data;
  const variables = useVariablesStore((s) => s.variables);
  const updateNode = useFlowStore((s) => s.updateNode);
  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const ui = useContext(FlowUIContext);
  const { videos } = useVideoStorage();

  const isUnlocked = useMemo(
    () => evalConditions(conditions, variables),
    [conditions, variables]
  );

  const attachVideo = async () => {
    setBusy(true);
    try {
      console.warn("Attach przez SceneNode -> zalecana nawigacja do /video i import tam.");
      handleNavigateToVideo();
    } finally {
      setBusy(false);
    }
  };

  const handleNavigateToVideo = () => {
    navigate("/video", {
      state: {
        sceneId: id,
        videoId: videoId,
      },
    });
  };

  const coverFromVideo = useMemo(() => {
    if (!ui.showSceneCovers || !videoId) return null;
    const v = videos.find((v) => v.id === videoId);
    return v?.coverImage ?? null;
  }, [ui.showSceneCovers, videoId, videos]);

  const showCover = !!(ui.showSceneCovers && coverFromVideo);

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

      {/* Uwaga: min-h-0 pozwala środkowej sekcji faktycznie się rozciągnąć */}
      <div className="p-4 h-full flex flex-col min-h-0">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-semibold text-zinc-200">{label}</h3>

          <div className="flex items-center gap-1">
            {isPriority && (
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
                    if (f) attachVideo();
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

        {/* Środkowa sekcja wypełnia całą pozostałą wysokość */}
        <div className="relative flex-1 min-h-0">
          {showCover ? (
            <div className="absolute inset-0 overflow-hidden rounded border border-zinc-700 bg-black">
              <img
                src={coverFromVideo!}
                alt="scene cover"
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          ) : (
            description && (
              <p className="text-xs leading-relaxed text-zinc-500 overflow-hidden text-ellipsis line-clamp-6">
                {description}
              </p>
            )
          )}
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
