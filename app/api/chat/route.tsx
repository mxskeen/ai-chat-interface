// app/api/chat/route.ts
import { convertToModelMessages, streamText, tool, UIMessage, streamUI } from 'ai/rsc';
import { z } from 'zod';
import { tvly } from '@/lib/tavily';
import { znapai } from '@/lib/znapai';
import { Card, CardBody } from '@heroui/react';
import { CodeSnippet, LoadingComponent, PropsDefinition, StylingNotes, UsageExample } from '@/components/chat/ToolParts';
import { ReactNode } from 'react';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

interface SearchResult {
  url: string;
  title: string;
  content: string;
  rawContent?: string;
}

// Enhanced browsing tool using Tavily
export const browseDocumentation = tool({
  description: 'Browse and fetch content from API documentation URLs or search for documentation',
  inputSchema: z.object({
    url: z.string().describe('The URL of the API documentation to browse or search query'),
    isSearch: z.boolean().optional().describe('Set to true if input is a search query instead of a URL'),
  }),
  execute: async ({ url, isSearch = false }) => {
    try {
      let result;
      
      if (isSearch) {
        // Use Tavily search for documentation
        const response = await tvly.search(url, {
          search_depth: "advanced",
          max_results: 3,
          include_answer: true,
          include_raw_content: true,
        });
        
        result = {
          type: 'search',
          query: url,
          answer: response.answer,
          results: response.results,
        };
      } else {
        // Try to extract content from specific URL
        const domain = new URL(url).hostname;
        const searchQuery = `site:${domain} documentation`;
        
        const response = await tvly.search(searchQuery, {
          search_depth: "advanced",
          max_results: 5,
          include_answer: true,
          include_raw_content: true,
        });
        
        // Find the most relevant result matching the URL
        const relevantResult = response.results.find((item: SearchResult) => 
          item.url.includes(domain) || 
          item.url.includes(url.split('/')[2])
        );
        
        if (relevantResult) {
          result = {
            type: 'url',
            url: url,
            title: relevantResult.title,
            content: relevantResult.content,
            rawContent: relevantResult.rawContent,
          };
        } else {
          // Fallback to general search results
          result = {
            type: 'search',
            query: url,
            answer: response.answer,
            results: response.results,
          };
        }
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to browse documentation: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

const componentGenerationSchema = z.object({
  componentName: z.string().describe('Name of the component to generate'),
  apiDescription: z.string().describe('Description of the API functionality'),
  props: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean().default(false),
    description: z.string(),
  })).optional(),
  styling: z.string().describe('Styling preferences and requirements'),
});

// Component generation tool remains the same
export const generateComponent = tool({
  description: 'Generate React components from API documentation with TypeScript and TailwindCSS',
  inputSchema: componentGenerationSchema,
  generate: async function* (args: z.infer<typeof componentGenerationSchema>): AsyncGenerator<ReactNode> {
    yield <LoadingComponent />;

    const result = await streamUI({
      model: znapai('gpt-4o-mini'),
      prompt: `Generate a React component called ${args.componentName} based on this API description: ${args.apiDescription}.
      
      Requirements:
      - Use TypeScript with proper type definitions
      - Use TailwindCSS for styling
      - Use HeroUI components (not shadcn/ui)
      - Include proper error handling
      - Make it responsive
      - Add accessibility attributes
      ${args.styling || ''}
      
      ${args.props ? `Props: ${JSON.stringify(args.props, null, 2)}` : ''}
      `,
      text: ({ content }: { content: string }) => <div>{content}</div>,
      tools: {
        showComponent: {
          description: 'Show the generated React component with usage examples',
          inputSchema: z.object({
            code: z.string().describe('The React component code'),
            usage: z.string().describe('Usage example'),
            propsDefinition: z.string().describe('Props interface definition'),
            stylingNotes: z.string().describe('Styling and customization notes'),
          }),
          generate: async function* ({ code, usage, propsDefinition, stylingNotes }: { code: string; usage: string; propsDefinition: string; stylingNotes: string }) {
            yield (
              <div className="space-y-4">
                <CodeSnippet code={code} />
                <div className="grid md:grid-cols-2 gap-4">
                  <PropsDefinition content={propsDefinition} />
                  <UsageExample content={usage} />
                </div>
                <StylingNotes content={stylingNotes} />
              </div>
            );
          },
        },
      },
    });

    return result.value;
  },
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = await streamText({
    model: znapai('gpt-4o-mini'),
    messages: convertToModelMessages(messages),
    tools: {
      browseDocumentation,
      generateComponent,
    },
  });

  return result.toAIStreamResponse();
}