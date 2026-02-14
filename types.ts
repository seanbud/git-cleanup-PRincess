export enum ThemeMode {
  PRINCESS = 'PRINCESS',
  PRINCE = 'PRINCE'
}

export enum FileStatus {
  MODIFIED = 'Modified',
  ADDED = 'Added',
  DELETED = 'Deleted',
  RENAMED = 'Renamed'
}

export enum ChangeType {
  UNCOMMITTED = 'Uncommitted Changes',
  STASHED = 'Stashed Changes',
  UNPUSHED = 'Unpushed Commits' // Older commits not yet upstream
}

export interface GitFile {
  id: string;
  path: string;
  status: FileStatus;
  changeType: ChangeType;
  commitMessage?: string; // For unpushed commits
  linesAdded: number;
  linesRemoved: number;
  diffContent?: string; // Mock diff content
}

export enum CharacterState {
  IDLE = 'IDLE',
  HOVER = 'HOVER',
  SELECTED = 'SELECTED',
  ACTION_GOOD = 'ACTION_GOOD',
  ACTION_BAD = 'ACTION_BAD'
}

export interface GitState {
  currentBranch: string;
  upstreamBranch: string;
  repoName: string;
  files: GitFile[];
  selectedFileIds: Set<string>;
  lastFetched: string;
}

export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  email?: string;
}

export interface GitConfig {
  name: string;
  email: string;
  defaultBranch: string;
}
