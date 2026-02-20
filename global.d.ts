export {};

declare global {
  interface Window {
    electronAPI: {
      on: (channel: string, callback: (data: any) => void) => void;
      // GitHub Auth
      githubStartAuth: () => Promise<any>;
      githubPollToken: (deviceCode: string) => Promise<string | null>;
      githubGetUser: (token?: string) => Promise<any>;
      githubIsAuthenticated: () => Promise<boolean>;
      githubSignOut: () => Promise<void>;
      // Git CLI
      gitCmd: (args: string[]) => Promise<{ stdout: string; stderr?: string; success: boolean }>;
      gitConfigGet: (key: string) => Promise<string>;
      // Repository Management
      openDirectory: () => Promise<any>;
      getRecentRepos: () => Promise<string[]>;
      addRecentRepo: (path: string) => Promise<void>;
      switchRepo: (path: string) => Promise<any>;
      // Shell
      openExternal: (url: string) => Promise<void>;
      showItemInFolder: (path: string) => Promise<void>;
      openDirectoryPath: (path: string) => Promise<void>;
      openEditor: (path: string, editor: string) => Promise<any>;
      openTerminal: (shell: string) => Promise<any>;
      trashFile: (path: string) => Promise<{ success: boolean; error?: string }>;
      getCwd: () => Promise<string>;
      // File Preview
      readFileBase64: (path: string) => Promise<any>;
      getGitFileBase64: (path: string) => Promise<any>;
      // Auto-Update
      checkForUpdate: () => Promise<void>;
      downloadUpdate: () => Promise<void>;
      installUpdate: () => Promise<void>;
      // Window Controls
      toggleFullScreen: () => Promise<void>;
      toggleDevTools: () => Promise<void>;
      newWindow: () => Promise<void>;
      getAppVersion: () => Promise<string>;
      getAppSettings: () => Promise<any>;
      saveAppSettings: (settings: any) => Promise<void>;
      setTitleBarOverlay?: (options: any) => Promise<void>;
      platform: string;
    };
  }
}
