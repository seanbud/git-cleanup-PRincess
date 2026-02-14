export {};

declare global {
  interface Window {
    electronAPI: {
      on: (channel: string, callback: (data: any) => void) => void;
      resolvePath: (path: string) => Promise<string>;
    };
  }
}
