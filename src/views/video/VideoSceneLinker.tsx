// src/views/video/VideoSceneLinker.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { Film, Search } from 'lucide-react';
import { useFlowStore } from '@/modules/flow/store/useFlowStore';
import { useVideoStorage, useVideoPlayerStore } from '@/modules/video';
import { isSceneNode } from '@/modules/flow/types';
import { useLocation } from 'react-router-dom';

export const VideoSceneLinker: React.FC = () => {
  const nodes = useFlowStore((s) => s.nodes);
  const updateNode = useFlowStore((s) => s.updateNode);
  const { videos, retrieveVideo } = useVideoStorage();
  const { setCurrentVideo, currentVideoId } = useVideoPlayerStore();
  const location = useLocation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  // Handle navigation from SceneNode
  useEffect(() => {
    const state = location.state as { sceneId?: string, videoId?: string } | undefined;
    if (state?.sceneId) {
      setSelectedSceneId(state.sceneId);
      if (state.videoId) {
        retrieveVideo(state.videoId).then(file => {
          if (file) setCurrentVideo(state.videoId!, file);
        });
      }
    }
  }, [location.state]);

  const sceneNodes = useMemo(
    () => nodes.filter(isSceneNode).filter(scene => 
      !searchTerm || 
      scene.data.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scene.id.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [nodes, searchTerm]
  );

  const handleSelectScene = async (sceneId: string, videoId?: string) => {
    setSelectedSceneId(sceneId);
    if (videoId) {
      const file = await retrieveVideo(videoId);
      if (file) setCurrentVideo(videoId, file);
    }
  };

  const handleLinkVideo = (sceneId: string) => {
    if (!currentVideoId) {
      alert('Select a video first');
      return;
    }
    updateNode(sceneId, { videoId: currentVideoId });
  };

  const currentVideo = videos.find(v => v.id === currentVideoId);
  const getVideo = (id?: string) => videos.find(v => v.id === id);

  return (
    <div className="w-96 bg-zinc-800 border-l border-zinc-900 flex flex-col">
      {/* Header */}
      <div className="h-8 bg-zinc-600/20 border-b border-zinc-900 flex items-center px-3">
        <span className="text-xs text-zinc-400 font-medium">SCENE LINKER</span>
      </div>

      {/* Current video */}
      {currentVideo && (
        <div className="px-3 py-2 bg-zinc-700/30 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <Film className="w-3 h-3 text-green-500" />
            <span className="text-[10px] text-zinc-400 truncate">
              Selected: {currentVideo.fileName}
            </span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="p-3 border-b border-zinc-900">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search scenes..."
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
          />
        </div>
      </div>

      {/* Scene list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sceneNodes.map(scene => {
          const video = getVideo(scene.data.videoId);
          const isSelected = selectedSceneId === scene.id;
          
          return (
            <div
              key={scene.id}
              onClick={() => handleSelectScene(scene.id, scene.data.videoId)}
              className={`p-3 bg-zinc-900 border cursor-pointer transition-all ${
                isSelected ? 'border-orange-500' : 'border-zinc-700 hover:border-zinc-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-medium text-zinc-200">{scene.data.label}</h3>
                  {video ? (
                    <p className="text-[10px] text-zinc-500 mt-1">
                      <Film className="w-3 h-3 inline mr-1" />
                      {video.fileName}
                    </p>
                  ) : (
                    <p className="text-[10px] text-zinc-600 mt-1">
                      No video • {scene.data.durationSec}s
                    </p>
                  )}
                </div>
                
                {/* Action links */}
                <div className="flex gap-2">
                  {video ? (
                    currentVideoId && currentVideoId !== scene.data.videoId ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLinkVideo(scene.id);
                        }}
                        className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        change
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateNode(scene.id, { videoId: undefined });
                        }}
                        className="text-[10px] text-zinc-500 hover:text-red-400 hover:underline"
                      >
                        remove
                      </button>
                    )
                  ) : (
                    currentVideoId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLinkVideo(scene.id);
                        }}
                        className="text-[10px] text-green-400 hover:text-green-300 hover:underline"
                      >
                        link
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {sceneNodes.length === 0 && (
          <div className="text-center py-8 text-xs text-zinc-500">
            {searchTerm ? 'No scenes found' : 'No scenes in project'}
          </div>
        )}
      </div>
    </div>
  );
};