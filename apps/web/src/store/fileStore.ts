import { create } from 'zustand';
import type { FileStoreState } from './fileTypes';

export const useFileStore = create<FileStoreState>((set) => ({
    workspacePath: null,
    files: [],
    currentFile: null,
    isLoading: false,
    isSaving: false,

    setWorkspacePath: (path) => set({ workspacePath: path }),
    setFiles: (files) => set({ files }),
    setCurrentFile: (file) => set({ currentFile: file }),
    setLoading: (loading) => set({ isLoading: loading }),
    setSaving: (saving) => set({ isSaving: saving }),
}));
