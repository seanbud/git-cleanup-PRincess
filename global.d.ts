export {};

declare global {
  interface Window {
    electronAPI: {
      on: (channel: string, callback: (data: any) => void) => void;
      // GitHub Auth
      githubStartAuth: (clientId: string) => Promise<any>;
      githubPollToken: (clientId: string, deviceCode: string) => Promise<string | null>;
      githubGetUser: (token?: string) => Promise<any>;
      githubIsAuthenticated: () => Promise<boolean>;
      githubSignOut: () => Promise<void>;
      // Git CLI
      gitCmd: (cmd: string) => Promise<{ stdout: string; stderr?: string; success: boolean }>;
      gitConfigGet: (key: string) => Promise<string>;
      // Repository Management
      openDirectory: () => Promise<{ path: string; error?: string } | { error: string } | null>;
      getRecentRepos: () => Promise<string[]>;
      addRecentRepo: (path: string) => Promise<void>;
      switchRepo: (path: string) => Promise<{ success: boolean; error?: string }>;
      // Shell
      openExternal: (url: string) => Promise<void>;
      showItemInFolder: (path: string) => Promise<void>;
      getCwd: () => Promise<string>;
      resolvePath: (path: string) => Promise<string>;
    };
  }
}
