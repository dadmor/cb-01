import React from "react";
import { Handle, Position } from "reactflow";
import { ChoiceNodeData } from "@/types";
import { useGameStore } from "@/modules/game/store";

interface ChoiceNodeProps {
  data: ChoiceNodeData;
  selected?: boolean;
}

export const ChoiceNode: React.FC<ChoiceNodeProps> = ({ data, selected }) => {
  const { label, effects, isAvailable, onClick } = data;
  const variables = useGameStore(state => state.variables);
  const canClick = isAvailable && onClick;
  
  const effectEntries = Object.entries(effects).filter(([_, value]) => value !== 0);
  const hasEffects = effectEntries.length > 0;
  
  return (
    <div style={{ position: 'relative' }}>
      <div 
        style={{
          position: 'relative',
          padding: '8px 20px',
          backgroundColor: canClick ? '#2a2a2a' : isAvailable ? '#1a1a1a' : '#0f0f0f',
          border: `2px solid ${
            selected ? '#E84E36' :
            canClick ? '#3a3a3a' : 
            '#2a2a2a'
          }`,
          color: canClick ? '#ccc' : isAvailable ? '#666' : '#444',
          fontSize: '12px',
          fontWeight: 500,
          cursor: canClick ? 'pointer' : isAvailable ? 'default' : 'not-allowed',
          transition: 'all 0.15s ease',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          minHeight: '32px'
        }}
        onClick={canClick ? onClick : undefined}
        onMouseEnter={(e) => {
          if (canClick) {
            e.currentTarget.style.backgroundColor = '#333';
            e.currentTarget.style.borderColor = '#E84E36';
          }
        }}
        onMouseLeave={(e) => {
          if (canClick) {
            e.currentTarget.style.backgroundColor = '#2a2a2a';
            e.currentTarget.style.borderColor = selected ? '#E84E36' : '#3a3a3a';
          }
        }}
      >
        <span>{label}</span>
        
        {hasEffects && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            marginLeft: '4px'
          }}>
            {effectEntries.map(([varName, value]) => (
              <div
                key={varName}
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: '#0f0f0f',
                  border: '1px solid #2a2a2a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  color: value > 0 ? '#4ade80' : '#ef4444'
                }}
                title={`${varName}: ${value > 0 ? '+' : ''}${value}`}
              >
                {value > 0 ? '↑' : '↓'}
              </div>
            ))}
          </div>
        )}
        
        {canClick && (
          <svg 
            width="10" 
            height="10" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            style={{ opacity: 0.4 }}
          >
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        )}
        
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
      </div>
      
      {/* Effects tooltip on hover */}
      {hasEffects && (
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: '-60px',
          opacity: 0,
          pointerEvents: 'none',
          transition: 'opacity 0.2s ease',
          zIndex: 10
        }}
        className="effects-tooltip"
        >
          <div style={{
            backgroundColor: '#0f0f0f',
            border: '1px solid #2a2a2a',
            padding: '6px 10px',
            fontSize: '10px',
            whiteSpace: 'nowrap'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {effectEntries.map(([varName, value]) => {
                const variable = variables.find(v => v.name === varName);
                if (!variable) return null;
                
                return (
                  <div key={varName} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#666' }}>{varName}:</span>
                    <span style={{
                      fontFamily: 'monospace',
                      fontWeight: 500,
                      color: value > 0 ? '#4ade80' : '#ef4444'
                    }}>
                      {value > 0 ? '+' : ''}{value}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{
              position: 'absolute',
              top: '-3px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderBottom: '4px solid #2a2a2a'
            }} />
          </div>
        </div>
      )}

      <style jsx>{`
        .effects-tooltip:hover {
          opacity: 1 !important;
        }
        div:hover .effects-tooltip {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};