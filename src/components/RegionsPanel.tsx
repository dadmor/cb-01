import React, { useRef, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useVideoStore } from '@/modules/video/store';
import { useFlowStore, isSceneNode } from '@/modules/flow/store';
import { VideoSegment } from '@/types';

export const RegionsPanel: React.FC = () => {
  const videoFile = useVideoStore(state => state.videoFile);
  const videoUrl = useVideoStore(state => state.videoUrl);
  const segments = useVideoStore(state => state.segments);
  const selectedSegmentId = useVideoStore(state => state.selectedSegmentId);
  const updateSegments = useVideoStore(state => state.updateSegments);
  const selectSegment = useVideoStore(state => state.selectSegment);
  const updateSegment = useVideoStore(state => state.updateSegment);
  const removeSegment = useVideoStore(state => state.removeSegment);
  const playSegmentInTimeline = useVideoStore(state => state.playSegmentInTimeline);
  
  const selectedNodeId = useFlowStore(state => state.selectedNodeId);
  const nodes = useFlowStore(state => state.nodes);
  const updateNode = useFlowStore(state => state.updateNode);
  
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

  // Mini waveform for visual reference
  useEffect(() => {
    if (!waveformRef.current || !videoUrl) return;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#4a5568',
      progressColor: '#3182ce',
      height: 40,
      normalize: true,
      barWidth: 1,
      barRadius: 1,
      interact: false,
      cursorWidth: 0,
    });

    const video = document.createElement('video');
    video.src = videoUrl;
    ws.load(video);
    
    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [videoUrl]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleAddSegment = () => {
    // Add segment at current time in timeline
    const currentTime = wavesurferRef.current?.getCurrentTime() || 0;
    const duration = wavesurferRef.current?.getDuration() || 100;
    
    const newSegment: VideoSegment = {
      id: `segment-${Date.now()}`,
      start: currentTime,
      end: Math.min(currentTime + 5, duration),
      duration: Math.min(5, duration - currentTime)
    };
    
    updateSegments([...segments, newSegment].sort((a, b) => a.start - b.start));
  };

  const handleAssignToScene = (segmentId: string) => {
    const selectedNode = nodes.find(n => n.id === selectedNodeId);
    if (!selectedNode || !isSceneNode(selectedNode)) return;
    
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;
    
    updateNode(selectedNode.id, {
      ...selectedNode.data,
      videoSegmentId: segment.id,
      durationSec: Math.round(segment.duration)
    });
  };

  const handleLabelUpdate = (segmentId: string, label: string) => {
    updateSegment(segmentId, { label });
    setEditingSegmentId(null);
    setEditingLabel('');
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const canAssignToScene = selectedNode && isSceneNode(selectedNode);

  return (
    <div className="h-full flex flex-col bg-zinc-850">
      {/* Header */}
      <div className="p-4 border-b border-zinc-700">
        <h2 className="text-sm font-semibold text-zinc-200 mb-3">Video Regions</h2>
        
       

       
      </div>

      {/* Segments list */}
     <div className="flex-1 overflow-y-auto">
        {segments.length === 0 ? (
          <div className="text-center text-zinc-500 text-sm py-8 px-4">
            No regions yet. Add regions from the timeline below.
          </div>
        ) : (
          segments.map((segment, index) => (
            <div
              key={segment.id}
              onClick={() => selectSegment(segment.id)}
              className={`
                px-4 py-3 cursor-pointer transition-all border-b border-zinc-800
                ${selectedSegmentId === segment.id 
                  ? 'bg-zinc-800/50' 
                  : 'hover:bg-zinc-850/50'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {/* Region number */}
                  <span className={`
                    text-xs font-mono
                    ${selectedSegmentId === segment.id ? 'text-blue-400' : 'text-zinc-500'}
                  `}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  
                  {/* Label */}
                  {editingSegmentId === segment.id ? (
                    <input
                      type="text"
                      value={editingLabel}
                      onChange={(e) => setEditingLabel(e.target.value)}
                      onBlur={() => handleLabelUpdate(segment.id, editingLabel)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleLabelUpdate(segment.id, editingLabel);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-zinc-900 border-b border-zinc-700 px-1 py-0.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                      placeholder="Region name..."
                      autoFocus
                    />
                  ) : (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSegmentId(segment.id);
                        setEditingLabel(segment.label || '');
                      }}
                      className="flex-1 text-sm text-zinc-300 hover:text-zinc-100 cursor-text"
                    >
                      {segment.label || <span className="text-zinc-600 italic">Untitled Region</span>}
                    </div>
                  )}
                  
                  {/* Time range */}
                  <div className="flex items-center gap-1 text-xs font-mono text-zinc-500">
                    <span>{formatTime(segment.start)}</span>
                    <span className="text-zinc-700">-</span>
                    <span>{formatTime(segment.end)}</span>
                  </div>
                  
                  {/* Duration */}
                  <span className="text-xs text-zinc-600 font-mono w-10 text-right">
                    {Math.round(segment.duration)}s
                  </span>
                </div>
                
                {/* Play button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playSegmentInTimeline(segment.id);
                  }}
                  className="ml-3 p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                  title="Play in timeline"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </button>
              </div>

              {/* Actions for selected segment */}
              {selectedSegmentId === segment.id && (
                <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between">
                  {canAssignToScene ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssignToScene(segment.id);
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      → Assign to Scene
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-600">
                      Select a scene node to assign
                    </span>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this region?')) {
                        removeSegment(segment.id);
                      }
                    }}
                    className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="p-4 border-t border-zinc-700 text-xs text-zinc-500">
        {segments.length} regions • {videoFile?.name || 'No video'}
      </div>
    </div>
  );
};