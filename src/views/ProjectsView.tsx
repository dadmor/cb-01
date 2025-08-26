// src/views/ProjectsView.tsx
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, Download, Clock, AlertCircle } from 'lucide-react';
import { useProjectIO } from '@/modules/project/hooks/useProjectIO';
import { useProjectStore } from '@/modules/project/store/useProjectStore';
import { VideoStorageService } from '@/modules/video/services/VideoStorageService';
import { cn } from '@/lib/utils';

export const ProjectsView: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  
  const currentProjectTitle = useProjectStore(s => s.projectTitle);
  const isDirty = useProjectStore(s => s.isDirty);
  const lastSaved = useProjectStore(s => s.lastSaved);

  const { isImporting, isExporting, handleExport, handleFileSelect, createNewProject } = useProjectIO({
    onImportSuccess: () => navigate('/storymap'),
    onImportError: (err) => {
      setImportError(err.message);
      setTimeout(() => setImportError(null), 5000);
    },
    confirmNewProject: true
  });

  const handleNewProject = async () => {
    if (createNewProject()) {
      try {
        const storage = VideoStorageService.getInstance();
        await storage.initialize();
        const videos = await storage.listVideos();
        for (const video of videos) {
          await storage.deleteVideo(video.id);
        }
      } catch (error) {
        console.error('Failed to clear video storage:', error);
      }
      navigate('/storymap');
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <div className="h-full bg-[#1a1a1a] overflow-auto p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Projects</h1>

        {importError && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 text-red-400 flex gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{importError}</span>
          </div>
        )}

        <div className="mb-8 p-6 bg-[#252525] border border-[#2a2a2a] flex justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">{currentProjectTitle}</h2>
            <div className="flex items-center gap-4 text-sm text-[#888]">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {lastSaved ? formatTimeAgo(lastSaved) : 'Not saved'}
              </span>
              {isDirty && <span className="text-yellow-500">• Unsaved changes</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/storymap')}
              className="px-4 py-2 bg-[#E84E36] text-white font-medium hover:bg-[#d63d2a]"
            >
              Continue Project
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className={cn("px-4 py-2 bg-[#333] text-white flex items-center gap-2",
                isExporting && "opacity-50 cursor-not-allowed")}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={handleNewProject}
            className="p-8 bg-[#252525] border-2 border-dashed border-[#3a3a3a] hover:border-[#E84E36] group">
            <Plus className="w-12 h-12 mx-auto mb-3 text-[#666] group-hover:text-[#E84E36]" />
            <h3 className="text-lg font-medium text-white">New Project</h3>
          </button>

          <button onClick={() => fileInputRef.current?.click()} disabled={isImporting}
            className={cn("p-8 bg-[#252525] border-2 border-dashed border-[#3a3a3a] hover:border-[#E84E36] group",
              isImporting && "opacity-50 cursor-not-allowed")}>
            <Upload className="w-12 h-12 mx-auto mb-3 text-[#666] group-hover:text-[#E84E36]" />
            <h3 className="text-lg font-medium text-white">
              {isImporting ? 'Importing...' : 'Open Project'}
            </h3>
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
      </div>
    </div>
  );
};