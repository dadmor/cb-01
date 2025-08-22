// ===== src/views/layout/QuickActions.tsx =====
import React, { RefObject } from 'react';
import { Upload, Download, Film } from 'lucide-react';

interface QuickActionsProps {
  fileInputRef: RefObject<HTMLInputElement>;
  videoInputRef: RefObject<HTMLInputElement>;
  isImporting: boolean;
  isExporting: boolean;
  videoFile: File | null;
  onTriggerImport: () => void;
  onHandleExport: () => void;
  onHandleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onHandleVideoSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  showActions: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  fileInputRef,
  videoInputRef,
  isImporting,
  isExporting,
  videoFile,
  onTriggerImport,
  onHandleExport,
  onHandleFileSelect,
  onHandleVideoSelect,
  showActions
}) => {
  if (!showActions) return null;

  return (
    <>
      <button
        onClick={onTriggerImport}
        disabled={isImporting}
        className="px-3 py-1.5 text-xs font-medium bg-[#2a2a2a] text-[#999] border border-[#3a3a3a] transition-colors hover:bg-[#333] hover:text-white disabled:opacity-50 flex items-center gap-2"
      >
        <Upload className="w-3 h-3" />
        {isImporting ? 'Importowanie...' : 'Importuj'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={onHandleFileSelect}
        className="hidden"
      />
      
      <button
        onClick={onHandleExport}
        disabled={isExporting}
        className="px-3 py-1.5 text-xs font-medium bg-[#2a2a2a] text-[#999] border border-[#3a3a3a] transition-colors hover:bg-[#333] hover:text-white disabled:opacity-50 flex items-center gap-2"
      >
        <Download className="w-3 h-3" />
        {isExporting ? 'Eksportowanie...' : 'Eksportuj'}
      </button>

      <div className="w-px h-5 bg-[#3a3a3a] mx-2" />

      <button
        onClick={() => videoInputRef.current?.click()}
        className={`px-3 py-1.5 text-xs font-medium border border-[#3a3a3a] transition-colors flex items-center gap-2 ${
          videoFile 
            ? 'bg-[#2d3a2d] text-green-400 hover:bg-[#3a4a3a]' 
            : 'bg-[#2a2a2a] text-[#999] hover:bg-[#333] hover:text-white'
        }`}
      >
        <Film className="w-4 h-4" />
        {videoFile ? videoFile.name : "Import Media"}
      </button>
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={onHandleVideoSelect}
        className="hidden"
      />
    </>
  );
};
