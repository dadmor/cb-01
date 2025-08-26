// src/views/video/VideoSceneLinker.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { Film } from 'lucide-react';
import { useFlowStore } from '@/modules/flow/store/useFlowStore';
import { useVideoStorage, useVideoPlayerStore } from '@/modules/video';
import { isSceneNode } from '@/modules/flow/types';
import { useLocation } from 'react-router-dom';
import { Button, Card, Input, Panel, PanelContent, PanelHeader } from '@/components/ui';


export const VideoSceneLinker: React.FC = () => {
  const nodes = useFlowStore((s) => s.nodes);
  const updateNode = useFlowStore((s) => s.updateNode);
  const { videos, retrieveVideo } = useVideoStorage();
  const { setCurrentVideo, currentVideoId } = useVideoPlayerStore();
  const location = useLocation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

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
    <Panel className="w-96 border-l border-zinc-800 flex flex-col">
      <PanelHeader title="Scene Linker"  />

      {/* Current video */}
      {currentVideo && (
        <div className="px-3 py-2 bg-zinc-800 border-b border-zinc-700">
          <div className="flex items-center gap-2">
            <Film className="w-3 h-3 text-green-500" />
            <span className="text-zinc-400 truncate" style={{ fontSize: '10px' }}>
              Selected: {currentVideo.fileName}
            </span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="p-3 border-b border-zinc-800">
        <Input

          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search scenes..."
         
        />
      </div>

      {/* Scene list */}
      <PanelContent className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {sceneNodes.map(scene => {
            const video = getVideo(scene.data.videoId);
            const isSelected = selectedSceneId === scene.id;
            
            return (
              <Card
                key={scene.id}
                selected={isSelected}
                compact
                className="cursor-pointer"
              >
                <div onClick={() => handleSelectScene(scene.id, scene.data.videoId)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-medium text-zinc-200">{scene.data.label}</h3>
                      {video ? (
                        <p className="text-zinc-500 mt-1" style={{ fontSize: '10px' }}>
                          <Film className="w-3 h-3 inline mr-1" />
                          {video.fileName}
                        </p>
                      ) : (
                        <p className="text-zinc-600 mt-1" style={{ fontSize: '10px' }}>
                          No video • {scene.data.durationSec}s
                        </p>
                      )}
                    </div>
                    
                    {/* Action links */}
                    <div className="flex gap-2">
                      {video ? (
                        currentVideoId && currentVideoId !== scene.data.videoId ? (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLinkVideo(scene.id);
                            }}
                          >
                            change
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateNode(scene.id, { videoId: undefined });
                            }}
                          >
                            remove
                          </Button>
                        )
                      ) : (
                        currentVideoId && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLinkVideo(scene.id);
                            }}
                          >
                            link
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {sceneNodes.length === 0 && (
            <div className="text-center py-8 text-xs text-zinc-500">
              {searchTerm ? 'No scenes found' : 'No scenes in project'}
            </div>
          )}
        </div>
      </PanelContent>
    </Panel>
  );
};