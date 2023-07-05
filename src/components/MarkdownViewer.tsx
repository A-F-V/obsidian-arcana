import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import React from 'react';

export default function MarkdownViewer({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[rehypeKatex]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <div className="beautiful-code">
              <div className="mac-buttons">
                <div className="mac-button close-button"></div>
                <div className="mac-button minimize-button"></div>
                <div className="mac-button expand-button"></div>
              </div>
              <SyntaxHighlighter
                {...props}
                children={String(children).replace(/\n$/, '')}
                style={dracula}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  fontFamily:
                    'Fira Code, Consolas, Menlo, Monaco, source-code-pro, Courier New, monospace',
                }}
              />
            </div>
          ) : (
            <code {...props} className={className}>
              {children}
            </code>
          );
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}
