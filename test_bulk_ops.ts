
import { GitService } from './services/gitService';

const mockGitCmd = (args: string[]) => {
    console.log(`GIT CMD: git ${args.join(' ')}`);
    return Promise.resolve({ success: true, stdout: '', stderr: '' });
};

const mockElectronAPI = {
    gitCmd: mockGitCmd,
    gitConfigGet: (key: string) => {
        console.log(`IPC: gitConfigGet ${key}`);
        return Promise.resolve('mock-value');
    },
    trashFile: (path: string) => {
        console.log(`IPC: trashFile ${path}`);
        return Promise.resolve({ success: true });
    }
};

// @ts-ignore
global.window = { electronAPI: mockElectronAPI };

async function runTest() {
    console.log('--- Testing bulk restoration ---');
    await GitService.restoreFiles(['file1.txt', 'file2.txt'], 'main');

    console.log('\n--- Testing bulk removal ---');
    await GitService.removeFiles(['file3.txt', 'file4.txt']);

    console.log('\n--- Testing parallelized config ---');
    await GitService.getGitConfig();
}

runTest().catch(console.error);
