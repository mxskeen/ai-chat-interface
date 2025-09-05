'use client';

import { Card, CardBody, Button } from '@heroui/react';
import { ExternalLink, Search } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
        <Card className="bg-yellow-50 border-yellow-200">
          <CardBody>
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
              <span>Browsing documentation...</span>
            </div>
          </CardBody>
        </Card>
      );
    
    case 'input-available':
      return (
        <Card className="bg-blue-50 border-blue-200">
          <CardBody>
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>
                {part.input?.isSearch ? (
                  <>Searching for: {part.input.url}</>
                ) : (
                  <>Fetching: {part.input?.url}</>
                )}
              </span>
            </div>
          </CardBody>
        </Card>
      );
    
    case 'output-available':
      const output = part.output;
      
      if (output?.type === 'search') {
        return (
          <Card className="bg-green-50 border-green-200">
            <CardBody>
              <div className="flex items-center gap-2 mb-2">
                <Search size={16} />
                <h4 className="font-semibold">🔍 Search Results</h4>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <strong>Query:</strong> {output.query}
              </div>
              
              {output.answer && (
                <div className="bg-blue-50 p-3 rounded-lg mb-3">
                  <h5 className="font-semibold mb-1">AI Summary:</h5>
                  <p className="text-sm">{output.answer}</p>
                </div>
              )}
              
              <div className="space-y-2">
                {output.results?.map((result: { title: string; url: string; content: string }, index: number) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <div className="flex items-start justify-between mb-1">
                      <h5 className="font-medium text-sm">{result.title}</h5>
                      <Button
                        size="sm"
                        variant="light"
                        startContent={<ExternalLink size={14} />}
                        onClick={() => window.open(result.url, '_blank')}
                      >
                        View
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{result.url}</p>
                    <p className="text-sm">{result.content}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        );
      } else {
        return (
          <Card className="bg-green-50 border-green-200">
            <CardBody>
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink size={16} />
                <h4 className="font-semibold">📄 Documentation</h4>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <strong>Source:</strong> {output?.title}
              </div>
              <div className="text-xs text-gray-500 mb-2">
                <strong>URL:</strong> {output?.url}
              </div>
              <div className="bg-white p-3 rounded border max-h-60 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">
                  {output?.content}
                  {output?.rawContent && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600 text-sm">Show raw content</summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {output.rawContent.substring(0, 2000)}
                        {output.rawContent.length > 2000 && '...'}
                      </pre>
                    </details>
                  )}
                </p>
              </div>
            </CardBody>
          </Card>
        );
      }
    
    case 'output-error':
      return (
        <Card className="bg-red-50 border-red-200">
          <CardBody>
            <h4 className="font-semibold text-red-800">❌ Error</h4>
            <p className="text-sm text-red-600">{part.errorText}</p>
          </CardBody>
        </Card>
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
        <Card className="bg-purple-50 border-purple-200">
          <CardBody>
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span>Generating component...</span>
            </div>
          </CardBody>
        </Card>
      );
    
    case 'input-available':
      return (
        <Card className="bg-indigo-50 border-indigo-200">
          <CardBody>
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              <span>Creating: {part.input?.componentName}</span>
            </div>
          </CardBody>
        </Card>
      );
    
    case 'output-available':
      return (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardBody>
            <h4 className="font-semibold mb-2">⚛️ Generated Component</h4>
            <div className="text-sm text-gray-600 mb-2">
              <strong>Component:</strong> {part.output?.componentName}
            </div>
            <div className="bg-gray-900 text-gray-100 p-3 rounded border overflow-x-auto">
              <pre className="text-sm">
                <code>{part.output?.code}</code>
              </pre>
            </div>
            {part.output?.usage && (
              <div className="mt-3 bg-blue-50 p-3 rounded">
                <h5 className="font-semibold mb-1">Usage Example:</h5>
                <pre className="text-sm">{part.output.usage}</pre>
              </div>
            )}
          </CardBody>
        </Card>
      );
    
    case 'output-error':
      return (
        <Card className="bg-red-50 border-red-200">
          <CardBody>
            <h4 className="font-semibold text-red-800">❌ Generation Error</h4>
            <p className="text-sm text-red-600">{part.errorText}</p>
          </CardBody>
        </Card>
      );
    
    default:
      return null;
  }
}

export const LoadingComponent = () => (
  <Card className="w-full">
    <CardBody>
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    </CardBody>
  </Card>
);

export const CodeSnippet = ({ code }: { code: string }) => (
  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
    <SyntaxHighlighter language="tsx" style={vscDarkPlus} customStyle={{ background: 'transparent', border: 'none', padding: 0 }}>
      {code}
    </SyntaxHighlighter>
  </div>
);

export const PropsDefinition = ({ content }: { content: string }) => (
  <div className="bg-blue-50 p-4 rounded-lg">
    <h4 className="font-semibold mb-2">Props Interface:</h4>
    <pre className="text-sm bg-white p-2 rounded">{content}</pre>
  </div>
);

export const UsageExample = ({ content }: { content: string }) => (
  <div className="bg-green-50 p-4 rounded-lg">
    <h4 className="font-semibold mb-2">Usage Example:</h4>
    <pre className="text-sm bg-white p-2 rounded">{content}</pre>
  </div>
);

export const StylingNotes = ({ content }: { content: string }) => (
  <div className="bg-yellow-50 p-4 rounded-lg">
    <h4 className="font-semibold mb-2">Styling & Customization:</h4>
    <p className="text-sm">{content}</p>
  </div>
);