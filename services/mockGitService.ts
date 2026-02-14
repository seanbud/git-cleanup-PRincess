import { FileStatus, GitFile, ChangeType } from '../types';

const PATHS = [
  'src/components/App.tsx',
  'src/components/Header.tsx',
  'src/utils/helpers.ts',
  'README.md',
  'package.json',
  'src/styles/main.css',
  'public/favicon.ico',
  'src/api/client.ts',
  'tests/app.test.tsx',
  'docker-compose.yml',
  '.github/workflows/deploy.yml',
  'src/types/index.ts',
  'src/features/auth/strategies/StrategyFactory.ts',
  'src/features/dashboard/DashboardLayout.tsx',
  'src/features/dashboard/widgets/GraphWidget.tsx',
  'src/features/settings/UserProfile.tsx',
  'src/lib/constants/actionTypes.ts',
  'src/lib/utils/dateFormatter.ts',
  'config/webpack.config.js',
  'server/controllers/UserController.js',
  'server/models/User.js',
  'server/routes/api.js'
];

export const MOCK_REPOS = [
  'git-cleanup-princess',
  'adventure-time-api',
  'candy-kingdom-ui',
  'ice-king-diary',
  'bmo-system-core',
  'marceline-bass-tabs'
];

export const MOCK_BRANCHES = [
  'main',
  'develop',
  'feature/shiny-new-buttons',
  'feature/princess-mode',
  'fix/nav-bar-wobble',
  'hotfix/login-crash',
  'chore/update-deps',
  'refactor/noodle-arms',
  'release/v1.0.0'
];

// Helper to generate a long diff with gaps
const generateLongDiff = (path: string) => {
  const isCode = path.endsWith('.ts') || path.endsWith('.tsx') || path.endsWith('.js');
  if (!isCode) return `@@ -1,5 +1,5 @@\n-Old Title\n+New Title\n Some content here.\n More content.`;

  let diff = '';
  // Chunk 1: Top of file
  diff += `@@ -1,15 +1,15 @@\n import React from 'react';\n import { useState } from 'react';\n \n-const OLD_CONSTANT = 10;\n+const NEW_CONSTANT = 20;\n \n // Some unchanged imports\n // to create context\n // around the changes.\n \n interface Props {\n-  oldProp: string;\n+  newProp: string;\n   sharedProp: number;\n }\n`;

  // Chunk 2: A large gap of unchanged lines (simulated)
  // In a real git diff, these wouldn't be in the string, but for our "folding" logic 
  // we will simulate a diff that includes context, or multiple hunks.
  // Standard git diffs usually skip unchanged lines, but to demonstrate folding 
  // effectively in a UI mock without a real git engine, we'll simulate "Hunks" 
  // by just concatenating them.
  
  diff += `\n@@ -45,10 +45,12 @@\n   const handleThing = () => {\n     // This function logic changed slightly\n-    doOldThing();\n+    doNewThing();\n+    doAnotherThing();\n     return true;\n   };\n \n   // Context line 1\n   // Context line 2\n`;

  diff += `\n@@ -120,7 +122,7 @@\n     return (\n       <div>\n-        <OldComponent />\n+        <NewComponent />\n         <span>Footer text</span>\n       </div>\n     );\n };\n`;

  // Add a very long unchanged section manually to test our specific folding logic
  // usually this is handled by just not including it in the diff, but if we want 
  // to show "Expand 50 lines", we need to mock the data structure or the gap.
  // For this mock, we will rely on the diff viewer to just show separate hunks, 
  // or we can simulate a very verbose diff (context=100) that we want to fold.
  
  // Let's simulate a verbose diff block
  diff += `\n@@ -200,5 +200,5 @@\n // End of file\n-export default OldName;\n+export default NewName;`;

  return diff;
};

// Generates a Diff that has a huge block of context to force folding logic if we implement it that way,
// OR simply generates multiple hunks. 
// Let's create a "Verbose" diff style where we have lots of context lines.
const generateVerboseDiff = () => {
  let lines = [];
  lines.push('@@ -10,100 +10,100 @@');
  lines.push(' import React from "react";');
  lines.push(' import { View } from "react-native";');
  lines.push('-import { OldHelper } from "./utils";');
  lines.push('+import { NewHelper } from "./utils";');
  
  // 30 lines of context
  for(let i=0; i<30; i++) {
    lines.push(` const unchangedLine${i} = "context";`);
  }
  
  lines.push('-const val = 100;');
  lines.push('+const val = 200;');

  // Another 40 lines of context
  for(let i=0; i<40; i++) {
    lines.push(` // More unchanged logic line ${i}`);
  }

  lines.push(' return <View />;');
  return lines.join('\n');
}


export const generateMockFiles = (): GitFile[] => {
  return PATHS.map((path, index) => {
    const statuses = [FileStatus.MODIFIED, FileStatus.MODIFIED, FileStatus.ADDED, FileStatus.DELETED];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Distribute files across different change types
    let changeType = ChangeType.UNCOMMITTED;
    let commitMessage = undefined;
    
    const rand = Math.random();
    if (rand > 0.7) {
      changeType = ChangeType.UNPUSHED;
      commitMessage = "feat: implement shiny new feature";
    } else if (rand > 0.9) {
      changeType = ChangeType.STASHED;
    }

    return {
      id: `file-${index}`,
      path,
      status,
      changeType,
      commitMessage,
      linesAdded: Math.floor(Math.random() * 150),
      linesRemoved: Math.floor(Math.random() * 50),
      // Randomly assign the verbose diff (foldable) or the multi-hunk diff
      diffContent: Math.random() > 0.5 ? generateVerboseDiff() : generateLongDiff(path)
    };
  });
};

export const mockGitOperation = async (duration: number = 800): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, duration));
};