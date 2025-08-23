// src/views/VideoView.tsx
import React from 'react';
import { Video, Lock } from 'lucide-react';

export const VideoView: React.FC = () => {
  return (
    <div className="h-full bg-[#1a1a1a] flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block">
          <Video className="w-24 h-24 mx-auto mb-6 text-[#444]" />
          <Lock className="w-10 h-10 absolute bottom-4 right-0 text-[#666]" />
        </div>
        <h1 className="text-2xl font-bold text-[#666] mb-2">Video Timeline</h1>
        <p className="text-[#555] text-sm mb-4">
          Coming soon...
        </p>
        <p className="text-[#444] text-xs max-w-md mx-auto">
          Video integration will allow you to sync your story scenes with video segments.
          This feature is currently under development.
        </p>
      </div>
    </div>
  );
};