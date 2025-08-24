// src/views/VideoView.tsx
import React from 'react';
import { VideoList } from '@/modules/video/components/VideoList';
import { VideoPlayer } from '@/modules/video/components/VideoPlayer';

export const VideoView: React.FC = () => {
  return (
    <div className="h-full bg-[#1a1a1a] flex">
      <VideoList />
      <VideoPlayer />
    </div>
  );
};