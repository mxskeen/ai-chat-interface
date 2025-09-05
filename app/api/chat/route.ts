// app/api/chat/route.ts
import { convertToModelMessages, streamText, tool, UIMessage } from 'ai';
import { z } from 'zod';
import { tvly } from '@/lib/tavily';
import { znapai } from '@/lib/znapai';

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

// Component generation tool remains the same
export const generateComponent = tool({
  description: 'Generate React components from API documentation with TypeScript and TailwindCSS',
  inputSchema: z.object({
    componentName: z.string().describe('Name of the component to generate'),
    apiDescription: z.string().describe('Description of the API functionality'),
    props: z.array(z.object({
      name: z.string(),
      type: z.string(),
      required: z.boolean().default(false),
      description: z.string(),
    })).optional(),
    styling: z.string().describe('Styling preferences and requirements'),
  }),
  execute: async ({ componentName, apiDescription, props, styling }) => {
    return {
      componentName,
      apiDescription,
      props: props || [],
      styling,
    };
  },
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  
  const result = streamText({
    model: znapai('gpt-4o-mini'),
    system: `You are an AI assistant that helps developers integrate APIs and generate React components. 
    When given API documentation URLs, use the browseDocumentation tool to fetch and summarize the content.
    When asked to search for documentation, use the browseDocumentation tool with isSearch=true.
    When asked to generate components, use the generateComponent tool to create TypeScript React components with TailwindCSS styling.
    Always provide clear explanations and usage examples.`,
    messages: convertToModelMessages(messages),
    tools: {
      browseDocumentation,
      generateComponent,
    },
  });

  return result.toUIMessageStreamResponse();
}