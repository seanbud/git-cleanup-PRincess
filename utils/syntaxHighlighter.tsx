import React from 'react';
import { ThemeMode } from '../types';

/**
 * A lightweight, dependency-free regex-based syntax highlighter
 * tailored for Princess/Prince themes.
 */
export function highlightCode(code: string, filePath: string, mode: ThemeMode): React.ReactNode {
    const isPrincess = mode === ThemeMode.PRINCESS;
    const ext = filePath.split('.').pop()?.toLowerCase();

    // Define color palettes
    const colors = {
        keyword: isPrincess ? 'text-pink-600 font-bold' : 'text-blue-500 font-bold',
        string: isPrincess ? 'text-purple-600' : 'text-cyan-600',
        comment: isPrincess ? 'text-gray-400 italic' : 'text-slate-500 italic',
        number: isPrincess ? 'text-orange-600' : 'text-amber-600',
        type: isPrincess ? 'text-rose-600' : 'text-indigo-600',
        function: isPrincess ? 'text-pink-800 font-semibold' : 'text-blue-700 font-semibold',
        key: isPrincess ? 'text-pink-900 font-bold' : 'text-slate-800 font-bold',
    };

    // Skip if we don't recognize the extension or it's empty
    if (!ext || !['ts', 'tsx', 'js', 'jsx', 'json', 'css', 'html'].includes(ext)) {
        return code;
    }

    // Preserve the git indicator (+, -, or space)
    const indicator = code.charAt(0);
    const rest = code.slice(1);

    let parts: { text: string; className?: string }[] = [{ text: rest }];

    const applyRegex = (regex: RegExp, className: string) => {
        const newParts: { text: string; className?: string }[] = [];
        parts.forEach(part => {
            if (part.className) {
                newParts.push(part);
                return;
            }

            let lastIndex = 0;
            let match;
            while ((match = regex.exec(part.text)) !== null) {
                // Text before match
                if (match.index > lastIndex) {
                    newParts.push({ text: part.text.substring(lastIndex, match.index) });
                }
                // The match itself
                newParts.push({ text: match[0], className });
                lastIndex = regex.lastIndex;
            }
            // Remaining text
            if (lastIndex < part.text.length) {
                newParts.push({ text: part.text.substring(lastIndex) });
            }
        });
        parts = newParts;
    };

    // Syntax rules based on extension
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
        applyRegex(/\/\/.*/g, colors.comment); // Single line comments
        applyRegex(/\/\*[\s\S]*?\*\//g, colors.comment); // Multi-line comments
        applyRegex(/(?:'|")[\s\S]*?(?:'|")/g, colors.string); // Strings
        applyRegex(/\b(const|let|var|function|return|if|else|for|while|import|from|export|default|class|extends|interface|type|async|await|try|catch|new|this|throw|break|continue|switch|case|default|void|null|undefined|true|false)\b/g, colors.keyword);
        applyRegex(/\b(string|number|boolean|any|Promise|React|Dispatch|SetStateAction|MouseEvent|RefObject)\b/g, colors.type);
        applyRegex(/\b\d+\b/g, colors.number);
        applyRegex(/\w+(?=\s*\()/g, colors.function);
    } else if (ext === 'json') {
        applyRegex(/(?:'|")[\s\S]*?(?:'|")(?=\s*:)/g, colors.key); // JSON keys
        applyRegex(/(?<=:\s*)(?:'|")[\s\S]*?(?:'|")/g, colors.string); // JSON string values
        applyRegex(/\b(true|false|null)\b/g, colors.keyword);
        applyRegex(/\b\d+\b/g, colors.number);
    } else if (ext === 'css') {
        applyRegex(/\/\*[\s\S]*?\*\//g, colors.comment);
        applyRegex(/[\w-]+(?=\s*:)/g, colors.key); // Property names
        applyRegex(/(?<=:\s*)([^;]+)/g, colors.string); // Values
        applyRegex(/@[a-z-]+/g, colors.keyword); // Media queries etc
    }

    return (
        <>
            <span className="opacity-50 select-none pr-1">{indicator}</span>
            {parts.map((part, i) => (
                <span key={i} className={part.className}>{part.text}</span>
            ))}
        </>
    );
}
