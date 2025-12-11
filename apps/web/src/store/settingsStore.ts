import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Image Upload Configuration Types
export interface GithubConfig {
    token: string;
    repo: string; // e.g., 'username/repo'
    branch?: string;
    useJsDelivr?: boolean;
}

export interface LocalConfig {
    serverUrl: string; // e.g., 'http://localhost:4000/api'
}

export interface SettingsStore {
    githubConfig?: GithubConfig;
    localConfig?: LocalConfig;
    // 预留给未来的其他设置
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (_set) => ({}),
        {
            name: 'wemd-settings',
        }
    )
);
