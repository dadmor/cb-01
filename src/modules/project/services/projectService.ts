// ===== PLIK 3: src/modules/project/services/projectService.ts =====
import { ProjectData, ProjectMetadata } from '../types';
import { useFlowStore } from '@/modules/flow/store';
import { useVariablesStore } from '@/modules/variables/stores/variablesStore';
import { useVideoStore } from '@/modules/video/store';
import { GameService } from '@/modules/game';

export class ProjectService {
  private static readonly CURRENT_VERSION = '1.0.0';
  private static readonly AUTOSAVE_KEY = 'storyflow-autosave';
  private static readonly AUTOSAVE_TIME_KEY = 'storyflow-autosave-time';

  /**
   * Eksportuj aktualny stan projektu do JSON
   */
  static exportProject(title: string): ProjectData {
    const { nodes, edges } = useFlowStore.getState();
    const { variables } = useVariablesStore.getState();
    const { segments } = useVideoStore.getState();

    const projectData: ProjectData = {
      title,
      nodes,
      edges,
      variables,
      videoSegments: segments,
      version: this.CURRENT_VERSION,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return projectData;
  }

  /**
   * Pobierz projekt jako plik JSON
   */
  static downloadProject(projectData: ProjectData): void {
    const dataStr = JSON.stringify(projectData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = `${projectData.title.replace(/\s+/g, '_')}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Importuj projekt z danych JSON
   */
  static async importProject(projectData: ProjectData): Promise<void> {
    // Waliduj dane projektu
    this.validateProjectData(projectData);

    // Zatrzymaj grę jeśli działa
    GameService.stopGame();

    // Załaduj dane flow
    const { loadProject } = useFlowStore.getState();
    loadProject(projectData.nodes, projectData.edges);

    // Załaduj zmienne
    useVariablesStore.setState({ variables: projectData.variables });

    // Załaduj segmenty wideo
    if (projectData.videoSegments) {
      useVideoStore.getState().updateSegments(projectData.videoSegments);
    }
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
        } catch (error) {
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
    const { clearProject } = useFlowStore.getState();
    const { clearVideo } = useVideoStore.getState();
    
    clearProject();
    clearVideo();
    GameService.stopGame();
    
    // Resetuj zmienne do wartości początkowych
    const { variables } = useVariablesStore.getState();
    useVariablesStore.setState({ 
      variables: variables.map(v => ({
        ...v,
        value: v.initialValue
      }))
    });
  }

  /**
   * Auto-zapis do localStorage
   */
  static autoSave(title: string): void {
    try {
      const projectData = this.exportProject(title);
      localStorage.setItem(this.AUTOSAVE_KEY, JSON.stringify(projectData));
      localStorage.setItem(this.AUTOSAVE_TIME_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Błąd auto-zapisu:', error);
    }
  }

  /**
   * Wczytaj auto-zapis
   */
  static loadAutoSave(): ProjectData | null {
    try {
      const saved = localStorage.getItem(this.AUTOSAVE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Błąd wczytywania auto-zapisu:', error);
      return null;
    }
  }

  /**
   * Pobierz czas ostatniego auto-zapisu
   */
  static getAutoSaveTime(): Date | null {
    const timeStr = localStorage.getItem(this.AUTOSAVE_TIME_KEY);
    return timeStr ? new Date(timeStr) : null;
  }

  /**
   * Usuń auto-zapis
   */
  static clearAutoSave(): void {
    localStorage.removeItem(this.AUTOSAVE_KEY);
    localStorage.removeItem(this.AUTOSAVE_TIME_KEY);
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
      hasVideo: projectData.videoSegments && projectData.videoSegments.length > 0
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
