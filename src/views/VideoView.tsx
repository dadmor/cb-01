// src/views/VideoView.tsx
import React from 'react';
import { FlowCanvas } from '@/modules/flow/FlowCanvas';
import { VideoTimeline } from '@/modules/video/VideoTimeline';
import { useVideoStore } from '@/modules/video/store';
import { Video } from 'lucide-react';
import { RegionsPanel } from './video/RegionsPanel';

export const VideoView: React.FC = () => {
  const videoFile = useVideoStore(state => state.videoFile);
  const segments = useVideoStore(state => state.segments);
  const selectedSegmentId = useVideoStore(state => state.selectedSegmentId);
  const updateSegments = useVideoStore(state => state.updateSegments);
  const selectSegment = useVideoStore(state => state.selectSegment);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Media Pool / Regions */}
        <div className="w-[300px] bg-[#1e1e1e] border-r border-[#0a0a0a] flex flex-col">
          <div className="h-8 bg-[#252525] border-b border-[#0a0a0a] flex items-center px-3">
            <span className="text-xs text-[#999] font-medium">MEDIA POOL</span>
          </div>
          
          {videoFile ? (
            <RegionsPanel />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Video className="w-16 h-16 mx-auto mb-3 text-[#444]" />
                <p className="text-[#666] text-[13px]">No media imported</p>
                <p className="text-[#666] text-[11px] mt-2">
                  Import media files from the top toolbar
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Center - Main Canvas */}
        <div className="flex-1 flex flex-col bg-[#1a1a1a]">
          {/* Viewer/Canvas area */}
          <div className="flex-1 relative">
            <FlowCanvas />
            
            {/* Viewer overlay controls */}
            <div className="absolute top-2 right-2 flex gap-1">
              <button className="p-2 bg-black/60 text-[#999] text-[11px] hover:bg-black/80 transition-colors">
                Viewer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Panel */}
      {videoFile && (
        <div className="h-[280px] bg-[#1a1a1a] border-t border-[#0a0a0a] flex flex-col">
          <VideoTimeline
            videoFile={videoFile}
            segments={segments}
            selectedSegmentId={selectedSegmentId || undefined}
            onSegmentsChange={updateSegments}
            onSegmentSelect={selectSegment}
          />
        </div>
      )}
    </div>
  );
};