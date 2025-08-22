import React from "react";
import { Handle, Position } from "reactflow";
import { SceneNodeData } from "@/types";
import { useVideoStore } from "@/modules/video/store";

interface SceneNodeProps {
  data: SceneNodeData;
  selected?: boolean;
}

export const SceneNode: React.FC<SceneNodeProps> = ({ data, selected }) => {
  const { 
    label, 
    description, 
    isUnlocked = true, 
    isCurrent, 
    remainingMs, 
    videoSegmentId,
    durationSec 
  } = data;
  
  const segments = useVideoStore(state => state.segments);
  const videoSegment = segments.find(s => s.id === videoSegmentId);
  
  const progress = remainingMs !== undefined && durationSec > 0
    ? ((durationSec * 1000 - remainingMs) / (durationSec * 1000)) * 100
    : 0;

  return (
    <div 
      style={{
        position: 'relative',
        width: '240px',
        minHeight: '80px',
        backgroundColor: isCurrent ? '#2a2a2a' : '#1a1a1a',
        border: `2px solid ${
          isCurrent ? '#E84E36' : 
          selected ? '#E84E36' : 
          '#2a2a2a'
        }`,
        opacity: isUnlocked ? 1 : 0.5,
        transition: 'all 0.15s ease'
      }}
    >
      <div style={{ padding: '12px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: '13px',
              fontWeight: 600,
              color: isCurrent ? '#fff' : '#ccc',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {label}
              {!isUnlocked && " 🔒"}
            </h3>
            
            {videoSegment && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <svg width="10" height="10" fill="#666" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                </svg>
                <span style={{ fontSize: '10px', color: '#666' }}>
                  {videoSegment.label || `Region ${segments.indexOf(videoSegment) + 1}`}
                </span>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isCurrent && (
              <div style={{ 
                width: '6px', 
                height: '6px', 
                backgroundColor: '#E84E36', 
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }} />
            )}
            
            {remainingMs !== undefined && remainingMs > 0 && (
              <span style={{
                fontSize: '10px',
                backgroundColor: '#0f0f0f',
                padding: '2px 6px',
                color: '#E84E36',
                fontFamily: 'monospace'
              }}>
                {Math.ceil(remainingMs / 1000)}s
              </span>
            )}
          </div>
        </div>
        
        {description && (
          <p style={{
            fontSize: '11px',
            lineHeight: '1.4',
            color: '#666',
            margin: '0 0 8px 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {description}
          </p>
        )}
        
        {/* Duration bar */}
        <div style={{ marginTop: '8px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '4px'
          }}>
            <span style={{ fontSize: '10px', color: '#666' }}>Duration</span>
            <span style={{ fontSize: '10px', color: '#999', fontFamily: 'monospace' }}>
              {durationSec}s
            </span>
          </div>
          
          <div style={{ 
            height: '2px', 
            backgroundColor: '#0f0f0f',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {isCurrent && (
              <div 
                style={{ 
                  height: '100%',
                  backgroundColor: '#E84E36',
                  width: `${progress}%`,
                  transition: 'width 0.1s linear'
                }}
              />
            )}
          </div>
        </div>
      </div>
      
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{
          width: '8px',
          height: '16px',
          backgroundColor: '#2a2a2a',
          border: '1px solid #3a3a3a',
          borderRadius: 0,
          left: '-5px'
        }}
      />
      
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{
          width: '8px',
          height: '16px',
          backgroundColor: '#2a2a2a',
          border: '1px solid #3a3a3a',
          borderRadius: 0,
          right: '-5px'
        }}
      />
      
      {!isUnlocked && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #2a2a2a',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <svg width="12" height="12" fill="#666" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
            </svg>
            <span style={{ fontSize: '11px', color: '#666', fontWeight: 500 }}>Locked</span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};