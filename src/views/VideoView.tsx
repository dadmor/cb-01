// src/views/VideoView.tsx - REFACTORED
import React from 'react';
import { VideoList } from './video/VideoList';
import { VideoPlayer } from './video/VideoPlayer';
import { VideoSceneLinker } from './video/VideoSceneLinker';
import { FlexContainer } from '@/components/ui';

export const VideoView: React.FC = () => {
  return (
    <FlexContainer direction="row" fullHeight className="bg-zinc-900">
      {/* Left: Video List (Media Pool) */}
      <VideoList />
      
      {/* Center: Video Player */}
      <FlexContainer direction="col" flex>
        <VideoPlayer />
      </FlexContainer>
      
      {/* Right: Scene Linker Sidebar */}
      <VideoSceneLinker />
    </FlexContainer>
  );
};