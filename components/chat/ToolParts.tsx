// components/chat/ToolParts.tsx
// Tool parts implementation based on ai-sdk.dev's tool calling architecture
// These components render the results of AI tool calls for documentation browsing and component generation
import { Card, CardBody, Button } from '@heroui/react';
import { ExternalLink, Search } from 'lucide-react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/hljs';

// Define types for tool parts
interface ToolPartBase {
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
}

interface DocumentationToolInput {
  isSearch?: boolean;
  url: string;
}

interface DocumentationToolOutput {
  type?: 'search' | 'url';
  query?: string;
  answer?: string;
  results?: Array<{ title: string; url: string; content: string }>;
  title?: string;
  url?: string;
  content?: string;
  rawContent?: string;
}

interface DocumentationToolPart extends ToolPartBase {
  input?: DocumentationToolInput;
  output?: DocumentationToolOutput;
  errorText?: string;
}

interface ComponentToolInput {
  componentName: string;
}

interface ComponentToolOutput {
  componentName: string;
  code: string;
  usage?: string;
}

interface ComponentToolPart extends ToolPartBase {
  input?: ComponentToolInput;
  output?: ComponentToolOutput;
  errorText?: string;
}

// Documentation Tool Part
interface DocumentationToolPartProps {
  part: DocumentationToolPart;
}

export function DocumentationToolPart({ part }: DocumentationToolPartProps) {
  switch (part.state) {
    case 'input-streaming':
      return (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[var(--accent)]/10 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin"></div>
              </div>
              <span className="text-sm font-medium text-[var(--foreground)]">Browsing Documentation</span>
            </div>
            <div className="text-xs text-[var(--muted)]">Processing...</div>
          </div>
          <div className="p-4 bg-[var(--background)]/30">
            <div className="h-8 w-full bg-[var(--border)]/50 rounded animate-pulse"></div>
            <div className="h-4 w-2/3 bg-[var(--border)]/50 rounded mt-3 animate-pulse"></div>
            <div className="h-4 w-3/4 bg-[var(--border)]/50 rounded mt-2 animate-pulse"></div>
          </div>
        </div>
      );
    
    case 'input-available':
      return (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[var(--accent)]/10 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin"></div>
              </div>
              <span className="text-sm font-medium text-[var(--foreground)]">
                {part.input?.isSearch ? 'Searching' : 'Fetching'}
              </span>
            </div>
            <div className="text-xs text-[var(--muted)] truncate max-w-[200px]">
              {part.input?.url}
            </div>
          </div>
          <div className="p-4 bg-[var(--background)]/30">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin"></div>
              <span className="text-sm text-[var(--muted)]">
                {part.input?.isSearch ? 'Searching for relevant information...' : 'Fetching documentation...'}
              </span>
            </div>
          </div>
        </div>
      );
    
    case 'output-available':
      const output = part.output;
      
      if (output?.type === 'search') {
        return (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-[var(--accent)]" />
                <span className="text-sm font-medium text-[var(--foreground)]">Search Results</span>
              </div>
              <div className="text-xs bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded-full font-medium">
                {output.results?.length || 0} results
              </div>
            </div>
            
            <div className="p-4">
              <div className="text-xs text-[var(--muted)] flex items-center gap-1 mb-3">
                <span className="font-medium">Query:</span> 
                <span className="bg-[var(--background)] px-2 py-0.5 rounded">{output.query}</span>
              </div>
              
              {output.answer && (
                <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/10 rounded-lg p-3 mb-4">
                  <h5 className="text-xs font-medium text-[var(--accent)] mb-1">AI Summary</h5>
                  <p className="text-sm text-[var(--foreground)]">{output.answer}</p>
                </div>
              )}
              
              <div className="space-y-3">
                {output.results?.map((result: { title: string; url: string; content: string }, index: number) => (
                  <div key={index} className="bg-[var(--background)]/50 border border-[var(--border)] rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-sm text-[var(--foreground)]">{result.title}</h5>
                      <button
                        className="text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)] px-2 py-1 rounded flex items-center gap-1 hover:bg-[var(--accent)]/5 transition-colors"
                        onClick={() => window.open(result.url, '_blank')}
                      >
                        <ExternalLink size={12} />
                        <span>View</span>
                      </button>
                    </div>
                    <p className="text-xs text-[var(--muted)] mb-2 truncate">{result.url}</p>
                    <p className="text-sm text-[var(--foreground)] line-clamp-3">{result.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <ExternalLink size={16} className="text-[var(--accent)]" />
                <span className="text-sm font-medium text-[var(--foreground)]">Documentation</span>
              </div>
              <div className="text-xs bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded-full font-medium">
                URL
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex flex-col gap-2 mb-3">
                <div>
                  <span className="text-xs text-[var(--muted)] font-medium">Source:</span>
                  <span className="text-sm text-[var(--foreground)] ml-1">{output?.title || 'Documentation'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[var(--muted)] font-medium">URL:</span>
                  <a 
                    href={output?.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--accent)] underline truncate max-w-[300px]"
                  >
                    {output?.url}
                  </a>
                </div>
              </div>
              
              <div className="bg-[var(--background)]/50 border border-[var(--border)] rounded-lg p-3 max-h-60 overflow-y-auto">
                <div className="text-sm text-[var(--foreground)] whitespace-pre-wrap">
                  {output?.content || 'No content available'}
                </div>
                
                  {output?.rawContent && (
                  <details className="mt-3 text-xs">
                    <summary className="cursor-pointer text-[var(--accent)] font-medium">
                      Show raw content
                    </summary>
                    <div className="mt-2 bg-[var(--background)] p-3 rounded-lg overflow-x-auto text-[var(--muted)]">
                        {output.rawContent.substring(0, 2000)}
                        {output.rawContent.length > 2000 && '...'}
                    </div>
                    </details>
                  )}
              </div>
            </div>
          </div>
        );
      }
    
    case 'output-error':
      return (
        <div className="bg-[var(--error)]/5 border border-[var(--error)]/20 rounded-xl overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--error)]/10">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-[var(--error)] rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-[var(--foreground)]">Error</span>
            </div>
            <div className="text-xs text-[var(--error)]">Documentation Failed</div>
          </div>
          
          <div className="p-4">
            <p className="text-sm text-[var(--error)]">{part.errorText}</p>
          </div>
        </div>
      );
    
    default:
      return null;
  }
}

// Component Tool Part remains the same
interface ComponentToolPartProps {
  part: ComponentToolPart;
}

export function ComponentToolPart({ part }: ComponentToolPartProps) {
  switch (part.state) {
    case 'input-streaming':
      return (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[var(--accent)]/10 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin"></div>
              </div>
              <span className="text-sm font-medium text-[var(--foreground)]">Generating Component</span>
            </div>
            <div className="text-xs text-[var(--muted)]">Processing...</div>
          </div>
          <div className="p-4 bg-[var(--background)]/30">
            <div className="h-8 w-full bg-[var(--border)]/50 rounded animate-pulse"></div>
            <div className="h-4 w-2/3 bg-[var(--border)]/50 rounded mt-3 animate-pulse"></div>
            <div className="h-4 w-3/4 bg-[var(--border)]/50 rounded mt-2 animate-pulse"></div>
          </div>
        </div>
      );
    
    case 'input-available':
      return (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[var(--accent)]/10 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin"></div>
              </div>
              <span className="text-sm font-medium text-[var(--foreground)]">Creating Component</span>
            </div>
            <div className="text-xs text-[var(--muted)] truncate max-w-[200px]">
              {part.input?.componentName}
            </div>
          </div>
          <div className="p-4 bg-[var(--background)]/30">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin"></div>
              <span className="text-sm text-[var(--muted)]">
                Generating TypeScript React component...
              </span>
            </div>
          </div>
        </div>
      );
    
    case 'output-available':
      return (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="currentColor" fillOpacity="0.2"/>
                <path d="M14.2857 11.0001L18 12.8573L14.2857 14.7144V11.0001Z" fill="currentColor"/>
                <path d="M6 14.7144V11.0001L9.71429 12.8573L6 14.7144Z" fill="currentColor"/>
                <path d="M14.2857 18.4287V14.7144L18 12.8573L14.2857 18.4287Z" fill="currentColor"/>
                <path d="M9.71429 18.4287L14.2857 14.7144V18.4287H9.71429Z" fill="currentColor"/>
                <path d="M9.71429 7.14294V11.0001L6 12.8573L9.71429 7.14294Z" fill="currentColor"/>
                <path d="M9.71429 7.14294L14.2857 11.0001V7.14294H9.71429Z" fill="currentColor"/>
              </svg>
              <span className="text-sm font-medium text-[var(--foreground)]">React Component</span>
            </div>
            <div className="text-xs bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded-full font-medium">
              TypeScript
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <span className="text-xs text-[var(--muted)] font-medium">Component:</span>
                <span className="text-sm text-[var(--foreground)] font-medium">{part.output?.componentName}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-[var(--success)] rounded-full"></div>
                <span className="text-xs text-[var(--muted)]">Generated</span>
              </div>
            </div>
            
            {/* Component Code */}
            <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)]">
              <div className="flex items-center justify-between bg-[var(--background)] border-b border-[var(--border)] px-4 py-2">
                <span className="text-xs font-medium text-[var(--muted)]">
                  {part.output?.componentName}.tsx
                </span>
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--error)]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--warning)]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--success)]"></div>
                </div>
              </div>
              <SyntaxHighlighter
                language="tsx"
                style={dracula}
                customStyle={{ 
                  margin: 0, 
                  borderRadius: 0,
                  fontSize: '13px',
                  padding: '12px',
                  background: 'var(--background)'
                }}
              >
                {part.output?.code || ''}
              </SyntaxHighlighter>
            </div>
            
            {/* Usage Example */}
            {part.output?.usage && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-3.5 h-3.5 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  </svg>
                  <span className="text-xs font-medium text-[var(--foreground)]">Usage Example</span>
                </div>
                
                <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)]">
                  <div className="flex items-center justify-between bg-[var(--background)] border-b border-[var(--border)] px-4 py-2">
                    <span className="text-xs font-medium text-[var(--muted)]">
                      Example.tsx
                    </span>
                    <div className="flex space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[var(--error)]"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-[var(--warning)]"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-[var(--success)]"></div>
                    </div>
                  </div>
                  <SyntaxHighlighter
                    language="tsx"
                    style={dracula}
                    customStyle={{ 
                      margin: 0, 
                      borderRadius: 0,
                      fontSize: '13px',
                      padding: '12px',
                      background: 'var(--background)'
                    }}
                  >
                    {part.output.usage}
                  </SyntaxHighlighter>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    
    case 'output-error':
      return (
        <div className="bg-[var(--error)]/5 border border-[var(--error)]/20 rounded-xl overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--error)]/10">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-[var(--error)] rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-[var(--foreground)]">Error</span>
            </div>
            <div className="text-xs text-[var(--error)]">Component Generation Failed</div>
          </div>
          
          <div className="p-4">
            <p className="text-sm text-[var(--error)]">{part.errorText}</p>
          </div>
        </div>
      );
    
    default:
      return null;
  }
}