import React, { useRef, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useVideoStore } from '@/modules/video/store';
import { useFlowStore, isSceneNode } from '@/modules/flow/store';


export const RegionsPanel: React.FC = () => {
  const videoFile = useVideoStore(state => state.videoFile);
  const videoUrl = useVideoStore(state => state.videoUrl);
  const segments = useVideoStore(state => state.segments);
  const selectedSegmentId = useVideoStore(state => state.selectedSegmentId);
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
  const [viewMode, setViewMode] = useState<'list' | 'thumbnails'>('list');

  // DaVinci styles
  const davinciPanelStyle = {
    backgroundColor: '#1e1e1e',
    color: '#ccc',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const
  };

  const davinciHeaderStyle = {
    backgroundColor: '#252525',
    borderBottom: '1px solid #0a0a0a',
    color: '#999',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    padding: '8px 12px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const davinciItemStyle = {
    backgroundColor: '#1a1a1a',
    border: '2px solid transparent',
    padding: '8px',
    marginBottom: '1px',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  };

  const davinciItemSelectedStyle = {
    ...davinciItemStyle,
    borderColor: '#E84E36',
    backgroundColor: '#2a1a1a'
  };

  const davinciButtonStyle = {
    backgroundColor: '#2a2a2a',
    border: '1px solid #3a3a3a',
    color: '#999',
    fontSize: '11px',
    fontWeight: 500,
    padding: '4px 8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  };

  const davinciInputStyle = {
    backgroundColor: '#0f0f0f',
    border: 'none',
    borderBottom: '1px solid #E84E36',
    color: '#ccc',
    fontSize: '12px',
    padding: '2px',
    width: '100%',
    outline: 'none'
  };

  // Mini waveform for visual reference
  useEffect(() => {
    if (!waveformRef.current || !videoUrl || viewMode !== 'list') return;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#3a3a3a',
      progressColor: '#E84E36',
      height: 30,
      normalize: true,
      barWidth: 1,
      barRadius: 0,
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
  }, [videoUrl, viewMode]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const formatTimecode = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30); // Assuming 30fps
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
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

  // Icons for DaVinci style
  const PlayIcon = () => (
    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
    </svg>
  );

  const FilmIcon = () => (
    <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
    </svg>
  );

  const ListIcon = () => (
    <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
    </svg>
  );

  return (
    <div style={davinciPanelStyle}>
      {/* Header with view mode toggle */}
      <div style={davinciHeaderStyle}>
        <span>MEDIA POOL - REGIONS</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              ...davinciButtonStyle,
              padding: '4px',
              backgroundColor: viewMode === 'list' ? '#E84E36' : '#2a2a2a',
              color: viewMode === 'list' ? 'white' : '#666'
            }}
            title="List View"
          >
            <ListIcon />
          </button>
          <button
            onClick={() => setViewMode('thumbnails')}
            style={{
              ...davinciButtonStyle,
              padding: '4px',
              backgroundColor: viewMode === 'thumbnails' ? '#E84E36' : '#2a2a2a',
              color: viewMode === 'thumbnails' ? 'white' : '#666'
            }}
            title="Thumbnail View"
          >
            <FilmIcon />
          </button>
        </div>
      </div>

      {/* Mini waveform preview */}
      {viewMode === 'list' && videoUrl && (
        <div style={{ 
          padding: '8px',
          backgroundColor: '#0f0f0f',
          borderBottom: '1px solid #0a0a0a'
        }}>
          <div 
            ref={waveformRef} 
            style={{ 
              width: '100%', 
              height: '30px',
              opacity: 0.7 
            }} 
          />
        </div>
      )}

      {/* Regions list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px' }}>
        {segments.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#666', 
            fontSize: '12px', 
            padding: '32px 16px' 
          }}>
            <FilmIcon />
            <p style={{ marginTop: '12px' }}>No regions defined</p>
            <p style={{ fontSize: '11px', marginTop: '4px' }}>
              Create regions in the timeline below
            </p>
          </div>
        ) : (
          viewMode === 'list' ? (
            // List view
            segments.map((segment, index) => (
              <div
                key={segment.id}
                onClick={() => selectSegment(segment.id)}
                style={selectedSegmentId === segment.id ? davinciItemSelectedStyle : davinciItemStyle}
                onMouseEnter={(e) => {
                  if (selectedSegmentId !== segment.id) {
                    e.currentTarget.style.backgroundColor = '#252525';
                    e.currentTarget.style.borderColor = '#3a3a3a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSegmentId !== segment.id) {
                    e.currentTarget.style.backgroundColor = '#1a1a1a';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Region number badge */}
                  <div style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: selectedSegmentId === segment.id ? '#E84E36' : '#2a2a2a',
                    color: selectedSegmentId === segment.id ? 'white' : '#666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  
                  {/* Label and timecode */}
                  <div style={{ flex: 1 }}>
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
                        style={davinciInputStyle}
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
                        style={{ cursor: 'text' }}
                      >
                        <div style={{ fontSize: '12px', color: '#ccc' }}>
                          {segment.label || <span style={{ color: '#666', fontStyle: 'italic' }}>Untitled Region</span>}
                        </div>
                        <div style={{ 
                          fontSize: '10px', 
                          color: '#666', 
                          fontFamily: 'monospace',
                          marginTop: '2px'
                        }}>
                          {formatTimecode(segment.start)} → {formatTimecode(segment.end)}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Duration badge */}
                  <div style={{
                    backgroundColor: '#0f0f0f',
                    padding: '2px 6px',
                    fontSize: '10px',
                    color: '#999',
                    fontFamily: 'monospace'
                  }}>
                    {Math.round(segment.duration)}s
                  </div>
                  
                  {/* Play button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playSegmentInTimeline(segment.id);
                    }}
                    style={{
                      ...davinciButtonStyle,
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Play in timeline"
                  >
                    <PlayIcon />
                  </button>
                </div>

                {/* Actions for selected segment */}
                {selectedSegmentId === segment.id && (
                  <div style={{ 
                    marginTop: '8px', 
                    paddingTop: '8px', 
                    borderTop: '1px solid #2a2a2a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    {canAssignToScene ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssignToScene(segment.id);
                        }}
                        style={{
                          ...davinciButtonStyle,
                          backgroundColor: '#2d3a2d',
                          borderColor: '#3a4a3a',
                          color: '#4ade80'
                        }}
                      >
                        → Assign to Scene
                      </button>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#666' }}>
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
                      style={{
                        ...davinciButtonStyle,
                        color: '#ef4444',
                        borderColor: '#3a2a2a'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            // Thumbnail view
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '8px' 
            }}>
              {segments.map((segment, index) => (
                <div
                  key={segment.id}
                  onClick={() => selectSegment(segment.id)}
                  style={{
                    ...davinciItemStyle,
                    padding: '4px',
                    borderColor: selectedSegmentId === segment.id ? '#E84E36' : 'transparent'
                  }}
                >
                  {/* Thumbnail placeholder */}
                  <div style={{
                    width: '100%',
                    paddingTop: '56.25%', // 16:9 aspect ratio
                    backgroundColor: '#0f0f0f',
                    position: 'relative',
                    marginBottom: '4px'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: '#3a3a3a'
                    }}>
                      <FilmIcon />
                    </div>
                    <div style={{
                      position: 'absolute',
                      top: '4px',
                      left: '4px',
                      backgroundColor: selectedSegmentId === segment.id ? '#E84E36' : '#2a2a2a',
                      color: selectedSegmentId === segment.id ? 'white' : '#666',
                      padding: '2px 6px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#ccc', marginBottom: '2px' }}>
                    {segment.label || 'Untitled'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#666', fontFamily: 'monospace' }}>
                    {formatTime(segment.start)} • {Math.round(segment.duration)}s
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Footer info */}
      <div style={{
        height: '24px',
        backgroundColor: '#1a1a1a',
        borderTop: '1px solid #0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        fontSize: '11px',
        color: '#666'
      }}>
        <span>{segments.length} regions</span>
        <span>{videoFile?.name || 'No media'}</span>
      </div>
    </div>
  );
};