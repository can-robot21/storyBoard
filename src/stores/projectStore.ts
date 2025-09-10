import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, StepType, StepStatus } from '../types/project';
import { generateId } from '../utils/helpers';

interface ProjectState {
  currentProject: Project | null;
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createProject: (name: string) => void;
  loadProject: (projectId: string) => void;
  saveProject: () => void;
  deleteProject: (projectId: string) => void;
  updateProject: (updates: Partial<Project>) => void;
  updateStep: (stepType: StepType, data: any) => void;
  updateStepStatus: (stepType: StepType, status: StepStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const initialProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  description: '',
  status: 'active',
  steps: {
    overview: {
      id: 'overview',
      title: '프로젝트 개요',
      description: 'AI 텍스트 생성',
      status: 'pending',
      data: {
        story: '',
        character: '',
        storyText: '',
        prompts: {
          storyPrompt: '',
          characterPrompt: '',
          scenarioPrompt: '',
        },
      },
    },
    character: {
      id: 'character',
      title: '캐릭터 설정',
      description: 'AI 이미지 생성',
      status: 'pending',
      data: {
        characters: [],
        backgrounds: [],
        settingCuts: [],
      },
    },
    video: {
      id: 'video',
      title: '영상 생성',
      description: '컷별 이미지 생성',
      status: 'pending',
      data: {
        settings: {
          cutCount: 3,
          videoRatio: '16:9',
          currentCutIndex: 0,
        },
        cuts: [],
        pagination: {
          currentPage: 1,
          itemsPerPage: 9,
          totalPages: 1,
        },
      },
    },
  },
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      currentProject: null,
      projects: [],
      isLoading: false,
      error: null,

      createProject: (name: string) => {
        const now = new Date().toISOString();
        const newProject: Project = {
          ...initialProject,
          id: generateId(),
          name: name,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          projects: [...state.projects, newProject],
          currentProject: newProject,
        }));
      },

      loadProject: (projectId: string) => {
        const project = get().projects.find(p => p.id === projectId);
        if (project) {
          set({ currentProject: project });
        } else {
          set({ error: '프로젝트를 찾을 수 없습니다.' });
        }
      },

      saveProject: () => {
        const { currentProject } = get();
        if (!currentProject) return;

        const updatedProject = {
          ...currentProject,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          projects: state.projects.map(p => 
            p.id === updatedProject.id ? updatedProject : p
          ),
          currentProject: updatedProject,
        }));
      },

      deleteProject: (projectId: string) => {
        set((state) => ({
          projects: state.projects.filter(p => p.id !== projectId),
          currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
        }));
      },

      updateProject: (updates: Partial<Project>) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const updatedProject = {
          ...currentProject,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          projects: state.projects.map(p => 
            p.id === updatedProject.id ? updatedProject : p
          ),
          currentProject: updatedProject,
        }));
      },

      updateStep: (stepType: StepType, data: any) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const updatedProject = {
          ...currentProject,
          steps: {
            ...currentProject.steps,
            [stepType]: {
              ...(currentProject.steps[stepType] as any),
              ...data,
            },
          },
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          projects: state.projects.map(p => 
            p.id === updatedProject.id ? updatedProject : p
          ),
          currentProject: updatedProject,
        }));
      },

      updateStepStatus: (stepType: StepType, status: StepStatus) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const updatedProject = {
          ...currentProject,
          steps: {
            ...currentProject.steps,
            [stepType]: {
              ...(currentProject.steps[stepType] as any),
              status,
            },
          },
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          projects: state.projects.map(p => 
            p.id === updatedProject.id ? updatedProject : p
          ),
          currentProject: updatedProject,
        }));
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'project-storage',
      partialize: (state) => ({ 
        projects: state.projects,
        currentProject: state.currentProject 
      }),
    }
  )
);
