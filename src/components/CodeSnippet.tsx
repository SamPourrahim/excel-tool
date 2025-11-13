
import React, { useState } from 'react';
import { ClipboardIcon, CheckIcon } from './IconComponents';

interface CodeSnippetProps {
  code: string;
}

export const CodeSnippet: React.FC<CodeSnippetProps> = ({ code }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

  if (!code) {
    return (
        <div className="flex items-center justify-center h-64">
            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg relative group">
        <button 
            onClick={handleCopy}
            className="absolute top-3 right-3 p-2 bg-slate-700 rounded-md text-slate-400 hover:bg-slate-600 hover:text-white transition-opacity opacity-0 group-hover:opacity-100"
            aria-label="Copy code"
            dir="ltr"
        >
            {copied ? <CheckIcon /> : <ClipboardIcon />}
        </button>
      <pre className="p-4 overflow-x-auto text-sm text-white" dir="ltr">
        <code>{code}</code>
      </pre>
    </div>
  );
};
