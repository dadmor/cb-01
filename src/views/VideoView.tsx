// src/views/VideoView.tsx
import React from 'react';
import { VideoList } from './video/VideoList';
import { VideoPlayer } from './video/VideoPlayer';


export const VideoView: React.FC = () => {
  return (
    <div className="h-full bg-[#1a1a1a] flex">
      <VideoList />
      <VideoPlayer />
    </div>
  );
};