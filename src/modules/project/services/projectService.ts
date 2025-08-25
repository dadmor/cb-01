// ============================================
// src/modules/project/services/projectService.ts
// ============================================
import { ProjectData, ProjectMetadata } from '../types';
import { useProjectStore } from '../store/useProjectStore';

export class ProjectService {
  private static readonly CURRENT_VERSION = '1.0.0';

  /**
   * Eksportuj aktualny stan projektu do JSON
   * - tytuł pobierany wyłącznie ze store'a (jedno źródło prawdy)
   */
  static exportProject(): ProjectData {
    const data = useProjectStore.getState().exportProject();
    return data;
  }

  /**
   * Pobierz projekt jako plik JSON (Blob + ObjectURL)
   */
  static downloadProject(projectData: ProjectData): void {
    const dataStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const safeTitle = projectData.title?.trim()?.length
      ? projectData.title.replace(/\s+/g, '_')
      : 'project';
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeTitle}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Importuj projekt z danych JSON
   */
  static async importProject(projectData: ProjectData): Promise<void> {
    this.validateProjectData(projectData);
    useProjectStore.getState().importProject(projectData);
  }

  /**
   * Wczytaj projekt z pliku
   */
  static async loadProjectFromFile(file: File): Promise<ProjectData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const projectData = JSON.parse(content) as ProjectData;
          resolve(projectData);
        } catch {
          reject(new Error('Nieprawidłowy format pliku projektu'));
        }
      };

      reader.onerror = () => reject(new Error('Błąd odczytu pliku'));
      reader.readAsText(file);
    });
  }

  /**
   * Utwórz nowy pusty projekt
   */
  static createNewProject(): void {
    useProjectStore.getState().newProject();
  }

  /**
   * Pobierz metadane projektu bez wczytywania pełnych danych
   */
  static async getProjectMetadata(file: File): Promise<ProjectMetadata> {
    const projectData = await this.loadProjectFromFile(file);

    return {
      title: projectData.title,
      version: projectData.version,
      createdAt: projectData.createdAt || 'Nieznana',
      updatedAt: projectData.updatedAt || 'Nieznana',
      nodeCount: projectData.nodes.length,
      edgeCount: projectData.edges.length,
    };
  }

  /**
   * Walidacja struktury danych projektu
   */
  private static validateProjectData(data: ProjectData): void {
    if (!data.title || typeof data.title !== 'string') {
      throw new Error('Nieprawidłowy projekt: brak tytułu');
    }

    if (!Array.isArray(data.nodes)) {
      throw new Error('Nieprawidłowy projekt: nodes musi być tablicą');
    }

    if (!Array.isArray(data.edges)) {
      throw new Error('Nieprawidłowy projekt: edges musi być tablicą');
    }

    if (!Array.isArray(data.variables)) {
      throw new Error('Nieprawidłowy projekt: variables musi być tablicą');
    }

    // Sprawdzenie zgodności wersji
    if (data.version && !this.isVersionCompatible(data.version)) {
      throw new Error(`Niezgodna wersja projektu: ${data.version}`);
    }
  }

  /**
   * Sprawdź czy wersja projektu jest zgodna
   */
  private static isVersionCompatible(version: string): boolean {
    const [major] = version.split('.');
    const [currentMajor] = this.CURRENT_VERSION.split('.');
    return major === currentMajor;
  }
}
