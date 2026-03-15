
import { execSync } from 'child_process';

const run = (cmd: string) => {
    const start = Date.now();
    try {
        execSync(cmd, { stdio: 'pipe' });
    } catch (e) {}
    return Date.now() - start;
};

console.log('--- Baseline Measurements (Simulated Sequential) ---');

const t1 = run('git status --porcelain');
const t2 = run('git diff --name-status main...HEAD');
const t3 = run('git diff --numstat --text');
const t4 = run('git diff --numstat --text --cached');
const t5 = run('git diff --numstat --text main...HEAD');

console.log(`git status: ${t1}ms`);
console.log(`git diff --name-status: ${t2}ms`);
console.log(`git diff --numstat (unstaged): ${t3}ms`);
console.log(`git diff --numstat (staged): ${t4}ms`);
console.log(`git diff --numstat (branch): ${t5}ms`);
console.log(`Total Sequential: ${t1 + t2 + t3 + t4 + t5}ms`);

console.log('\nNote: In a real Electron app, each call also incurs IPC overhead (~1-2ms).');
console.log('Parallel execution would reduce the total time to roughly the longest single call.');
