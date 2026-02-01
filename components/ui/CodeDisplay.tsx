import React from 'react';
import { cn } from '../../lib/utils';

interface CodeDisplayProps {
    code: string;
    className?: string;
    showLineNumbers?: boolean;
}

const CodeDisplay: React.FC<CodeDisplayProps> = ({ code, className, showLineNumbers = true }) => {
    const lines = code.split('\n');

    return (
        <div className={cn(
            "rounded-lg overflow-hidden border border-slate-700 bg-[#1e1e1e] font-mono text-sm shadow-xl",
            className
        )}>
            {/* Header / Title Bar (Optional aesthetic) */}
            <div className="flex items-center px-4 py-2 bg-[#252526] border-b border-slate-700 gap-2">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="text-xs text-gray-500 ml-2">Main.py</div>
            </div>

            {/* Code Content */}
            <div className="p-4 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <tbody>
                        {lines.map((line, index) => (
                            <tr key={index}>
                                {showLineNumbers && (
                                    <td className="pr-4 text-right select-none text-gray-600 w-[1%] align-top whitespace-nowrap border-r border-slate-800/50">
                                        {index + 1}
                                    </td>
                                )}
                                <td className="pl-4 align-top whitespace-pre text-gray-300">
                                    <span dangerouslySetInnerHTML={{ __html: syntaxHighlight(line) }} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Robust syntax highlighter with masking
function syntaxHighlight(line: string): string {
    if (!line) return '&nbsp;';

    // 1. Escape HTML special chars
    let processed = line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Mask storage
    const chunks: string[] = [];
    const save = (content: string) => {
        chunks.push(content);
        return `__CHUNK_${chunks.length - 1}__`;
    };

    // 2. Extract Strings (mask them first to protect contents)
    processed = processed.replace(/(['"])(.*?)\1/g, (match) => save(`<span class="text-orange-400">${match}</span>`));

    // 3. Extract Comments (end of line)
    // Matches # ... and ensures it's not inside a string (covered by step 2 masking)
    processed = processed.replace(/(#.*$)/g, (match) => save(`<span class="text-green-600 italic">${match}</span>`));

    // 4. Highlight Function Definitions (def name)
    // Capture 'def' and the name, highlight potentially separate parts
    processed = processed.replace(/\bdef\s+(\w+)/g, (match, name) => {
        return save(`<span class="text-purple-400 font-bold">def</span> <span class="text-yellow-400">${name}</span>`);
    });

    // 5. Highlight Keywords
    const keywords = ['def', 'return', 'if', 'elif', 'else', 'for', 'while', 'print', 'input', 'import', 'from', 'class', 'break', 'continue', 'pass', 'and', 'or', 'not', 'in', 'is'];
    const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    processed = processed.replace(keywordRegex, (match) => {
        if (match.startsWith('__CHUNK_')) return match;
        return save(`<span class="text-purple-400 font-bold">${match}</span>`);
    });

    // 6. Highlight Function Calls
    processed = processed.replace(/\b([a-zA-Z_]\w*)(?=\()/g, (match) => {
        if (match.startsWith('__CHUNK_')) return match;
        if (keywords.includes(match)) return match; // fallback check
        return save(`<span class="text-yellow-200">${match}</span>`);
    });

    // 7. Highlight Numbers
    processed = processed.replace(/\b(\d+)\b/g, (match) => {
        // Should not match inside __CHUNK_N__ due to \b boundary check against underscores, 
        // but strictly safe:
        if (match.startsWith('__CHUNK_')) return match;
        return save(`<span class="text-blue-400">${match}</span>`);
    });

    // 8. Restore chunks
    chunks.forEach((chunk, index) => {
        processed = processed.replace(new RegExp(`__CHUNK_${index}__`, 'g'), chunk);
    });

    return processed;
}

export default CodeDisplay;
