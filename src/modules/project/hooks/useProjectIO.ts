// ===== PLIK 4: src/modules/project/hooks/useProjectIO.ts =====
import { useState, useRef, useCallback } from 'react';
import { ProjectService } from '../services/projectService';
import { ProjectData } from '../types';
import { useProjectStore } from '../store/useProjectStore';

interface UseProjectIOOptions {
  onImportSuccess?: (projectData: ProjectData) => void;
  onImportError?: (error: Error) => void;
  onExportSuccess?: () => void;
  confirmNewProject?: boolean;
}

export const useProjectIO = (options: UseProjectIOOptions = {}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Jedno źródło prawdy: tytuł tylko ze store'a
  const projectTitle = useProjectStore((s) => s.projectTitle);

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      const projectData = ProjectService.exportProject();
      ProjectService.downloadProject(projectData);
      options.onExportSuccess?.();
    } catch (error) {
      console.error('Błąd eksportu:', error);
    } finally {
      setIsExporting(false);
    }
  }, [options]);

  const handleImport = useCallback(
    async (file: File) => {
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
    },
    [options]
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleImport(file);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleImport]
  );

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

  return {
    fileInputRef,
    isImporting,
    isExporting,
    projectTitle,
    handleExport,
    handleImport,
    handleFileSelect,
    triggerImport,
    createNewProject,
  };
};
