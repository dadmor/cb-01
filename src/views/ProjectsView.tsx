// src/views/ProjectsView.tsx - REFACTORED
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, Download, Clock, AlertCircle } from 'lucide-react';
import { useProjectIO } from '@/modules/project/hooks/useProjectIO';
import { useProjectStore } from '@/modules/project/store/useProjectStore';
import { VideoStorageService } from '@/modules/video/services/VideoStorageService';
import { 
  Button, 
  Card, 
  Panel, 
  PanelContent,
  FlexContainer,
  StatusText
} from '@/components/ui';

// Komponent dla karty błędu
const ErrorCard: React.FC<{ message: string }> = ({ message }) => (
  <Card className="mb-6 bg-red-900 bg-opacity-20 border-red-500 border-opacity-50">
    <FlexContainer className="gap-3">
      <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
      <StatusText variant="error" size="sm">{message}</StatusText>
    </FlexContainer>
  </Card>
);

// Komponent dla karty projektu
const ProjectCard: React.FC<{
  title: string;
  lastSaved: Date | null;
  isDirty: boolean;
  onContinue: () => void;
  onExport: () => void;
  isExporting: boolean;
}> = ({ title, lastSaved, isDirty, onContinue, onExport, isExporting }) => {
  
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <Card className="mb-8">
      <FlexContainer className="justify-between items-start">
        <FlexContainer direction="col">
          <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
          <FlexContainer className="gap-4">
            <FlexContainer className="gap-1">
              <Clock className="w-4 h-4 text-zinc-500" />
              <StatusText variant="muted" size="sm">
                {lastSaved ? formatTimeAgo(lastSaved) : 'Not saved'}
              </StatusText>
            </FlexContainer>
            {isDirty && (
              <StatusText variant="warning" size="sm">• Unsaved changes</StatusText>
            )}
          </FlexContainer>
        </FlexContainer>
        <FlexContainer className="gap-2">
          <Button variant="primary" onClick={onContinue}>
            Continue Project
          </Button>
          <Button
            variant="default"
            icon={Download}
            onClick={onExport}
            disabled={isExporting}
          >
            Export
          </Button>
        </FlexContainer>
      </FlexContainer>
    </Card>
  );
};

// Komponent dla gridu akcji
const ActionGrid: React.FC<{
  onNewProject: () => void;
  onImportClick: () => void;
  isImporting: boolean;
}> = ({ onNewProject, onImportClick, isImporting }) => (
  <div className="grid grid-cols-2 gap-4">
    <Card className="p-8 border-2 border-dashed hover:border-orange-600 cursor-pointer transition-colors group">
      <button onClick={onNewProject} className="w-full">
        <FlexContainer direction="col" className="items-center">
          <Plus className="w-12 h-12 mb-3 text-zinc-600 group-hover:text-orange-600" />
          <h3 className="text-lg font-medium text-white">New Project</h3>
        </FlexContainer>
      </button>
    </Card>

    <Card className="p-8 border-2 border-dashed hover:border-orange-600 cursor-pointer transition-colors group">
      <button onClick={onImportClick} disabled={isImporting} className="w-full">
        <FlexContainer direction="col" className="items-center">
          <Upload className="w-12 h-12 mb-3 text-zinc-600 group-hover:text-orange-600" />
          <h3 className="text-lg font-medium text-white">
            {isImporting ? 'Importing...' : 'Open Project'}
          </h3>
        </FlexContainer>
      </button>
    </Card>
  </div>
);

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

  return (
    <Panel className="h-full overflow-auto">
      <PanelContent>
        <div className="max-w-4xl mx-auto py-8">
          <h1 className="text-3xl font-bold text-white mb-8">Projects</h1>

          {importError && <ErrorCard message={importError} />}

          <ProjectCard
            title={currentProjectTitle}
            lastSaved={lastSaved}
            isDirty={isDirty}
            onContinue={() => navigate('/storymap')}
            onExport={handleExport}
            isExporting={isExporting}
          />

          <ActionGrid
            onNewProject={handleNewProject}
            onImportClick={() => fileInputRef.current?.click()}
            isImporting={isImporting}
          />

          <input 
            ref={fileInputRef} 
            type="file" 
            accept=".json" 
            onChange={handleFileSelect} 
            className="hidden" 
          />
        </div>
      </PanelContent>
    </Panel>
  );
};