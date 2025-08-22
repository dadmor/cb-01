// ===== PLIK 4: src/modules/project/hooks/useProjectIO.ts =====
import { useState, useRef, useCallback, useEffect } from 'react';
import { ProjectService } from '../services/projectService';
import { ProjectData } from '../types';

interface UseProjectIOOptions {
  onImportSuccess?: (projectData: ProjectData) => void;
  onImportError?: (error: Error) => void;
  onExportSuccess?: () => void;
  confirmNewProject?: boolean;
  autoSaveInterval?: number; // w milisekundach
  autoSaveEnabled?: boolean;
}

export const useProjectIO = (
  projectTitle: string,
  options: UseProjectIOOptions = {}
) => {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-zapis
  useEffect(() => {
    if (!options.autoSaveEnabled || !options.autoSaveInterval) return;

    const interval = setInterval(() => {
      ProjectService.autoSave(projectTitle);
      setLastAutoSave(new Date());
    }, options.autoSaveInterval);

    return () => clearInterval(interval);
  }, [projectTitle, options.autoSaveEnabled, options.autoSaveInterval]);

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      const projectData = ProjectService.exportProject(projectTitle);
      ProjectService.downloadProject(projectData);
      options.onExportSuccess?.();
    } catch (error) {
      console.error('Błąd eksportu:', error);
    } finally {
      setIsExporting(false);
    }
  }, [projectTitle, options]);

  const handleImport = useCallback(async (file: File) => {
    try {
      setIsImporting(true);
      const projectData = await ProjectService.loadProjectFromFile(file);
      await ProjectService.importProject(projectData);
      options.onImportSuccess?.(projectData);
    } catch (error) {
      console.error('Błąd importu:', error);
      options.onImportError?.(error as Error);
    } finally {
      setIsImporting(false);
    }
  }, [options]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImport(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleImport]);

  const triggerImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const createNewProject = useCallback(() => {
    if (options.confirmNewProject) {
      if (!confirm('Utworzyć nowy projekt? Niezapisane zmiany zostaną utracone.')) {
        return false;
      }
    }
    ProjectService.createNewProject();
    return true;
  }, [options.confirmNewProject]);

  const loadAutoSave = useCallback(async () => {
    const autoSaved = ProjectService.loadAutoSave();
    if (autoSaved) {
      await ProjectService.importProject(autoSaved);
      return autoSaved;
    }
    return null;
  }, []);

  const hasAutoSave = useCallback(() => {
    return ProjectService.loadAutoSave() !== null;
  }, []);

  return {
    fileInputRef,
    isImporting,
    isExporting,
    lastAutoSave,
    handleExport,
    handleImport,
    handleFileSelect,
    triggerImport,
    createNewProject,
    loadAutoSave,
    hasAutoSave
  };
};