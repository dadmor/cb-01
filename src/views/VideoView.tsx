// src/views/VideoView.tsx
import React from 'react';
import { VideoList } from './video/VideoList';
import { VideoPlayer } from './video/VideoPlayer';
import { VideoSceneLinker } from './video/VideoSceneLinker';

export const VideoView: React.FC = () => {
  return (
    <div className="h-full bg-zinc-900 flex">
      {/* Left: Video List (Media Pool) */}
      <VideoList />
      
      {/* Center: Video Player */}
      <div className="flex-1 flex flex-col">
        <VideoPlayer />
      </div>
      
      {/* Right: Scene Linker Sidebar */}
      <VideoSceneLinker />
    </div>
  );
};