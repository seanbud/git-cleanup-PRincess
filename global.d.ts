export {};

declare global {
  const GITHUB_CLIENT_ID: string;
  interface Window {
    electronAPI: {
      on: (channel: string, callback: (data: any) => void) => void;
      resolvePath: (path: string) => Promise<string>;
    };
  }
}
