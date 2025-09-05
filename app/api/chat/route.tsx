// app/api/chat/route.tsx (refactored end-to-end)
import { streamText, convertToModelMessages, tool } from 'ai';
import { z } from 'zod';
import { tvly } from '@/lib/tavily';
import { znapai } from '@/lib/znapai';
import type { UIMessage } from '@ai-sdk/react';

export const maxDuration = 30;

interface TavilyResult { title: string; url: string; content: string; raw_content?: string }

// Browse / documentation tool
export const browseDocumentation = tool({
  description: 'Browse and fetch content from API documentation URLs or perform a search query.',
  inputSchema: z.object({
    url: z.string().describe('Either a full URL to fetch related docs for, or a search query'),
    isSearch: z.boolean().optional().describe('True if the url field is actually a search query')
  }),
  execute: async ({ url, isSearch = false }) => {
    try {
      if (isSearch) {
        const response = await tvly.search(url, {
          search_depth: 'advanced',
          max_results: 5,
          include_answer: true,
          include_raw_content: true
        });
        return {
          type: 'search',
          query: url,
          answer: response.answer,
          results: response.results?.map((r: TavilyResult) => ({
            title: r.title,
            url: r.url,
            content: r.content?.slice(0, 1200)
          }))
        };
      }
      // Treat as URL – derive domain & perform focused search
      const domain = new URL(url).hostname;
      const focusedQuery = `site:${domain} api documentation`;
      const response = await tvly.search(focusedQuery, {
        search_depth: 'advanced',
        max_results: 6,
        include_answer: true,
        include_raw_content: true
      });
      const match = response.results?.find((r: TavilyResult) => r.url.includes(domain));
      if (match) {
        return {
          type: 'url',
          url,
          title: match.title,
          content: match.content?.slice(0, 5000),
          rawContent: match.rawContent?.slice(0, 6000)
        };
      }
      return {
        type: 'search',
        query: url,
        answer: response.answer,
        results: response.results?.map((r: TavilyResult) => ({
          title: r.title,
          url: r.url,
          content: r.content?.slice(0, 1200)
        }))
      };
    } catch (e) {
      throw new Error(`Browse failure: ${(e as Error).message}`);
    }
  }
});

// Component generation tool
const componentGenSchema = z.object({
  componentName: z.string(),
  apiDescription: z.string(),
  props: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean().default(false),
    description: z.string()
  })).optional(),
  styling: z.string().default('').describe('Styling preferences / Tailwind direction')
});

export const generateComponent = tool({
  description: 'Generate a typed React component (Tailwind + HeroUI) including usage & props interface.',
  inputSchema: componentGenSchema,
  execute: async ({ componentName, apiDescription, props, styling }) => {
    // Build interface from props (deterministic). For richer AI authored code we could invoke a model, but this keeps reliability high.
    const interfaceName = `${componentName}Props`;
    const propsInterface = `export interface ${interfaceName} {\n${(props||[]).map(p => `  /** ${p.description} */\n  ${p.name}${p.required ? '' : '?'}: ${p.type};`).join('\n')}\n}`;

    const heroImports = `import { Card, CardHeader, CardBody, CardFooter, Button } from '@heroui/react';`;

    const componentCode = `import React from 'react';\n${heroImports}\n${propsInterface}\n\nexport function ${componentName}({ ${(props||[]).map(p=>p.name).join(', ')} }: ${interfaceName}) {\n  return (\n    <Card className=\"w-full max-w-md shadow-lg border border-default-200\">\n      <CardHeader className=\"pb-2\">\n        <h3 className=\"text-lg font-semibold\">${componentName}</h3>\n      </CardHeader>\n      <CardBody className=\"space-y-2 text-sm\">\n        {/* Rendered content based on API data / props */}\n        <pre className=\"bg-default-100 rounded p-2 text-xs overflow-x-auto\">{JSON.stringify({ ${(props||[]).map(p=>p.name).join(', ')} }, null, 2)}</pre>\n        <p className=\"text-default-500 leading-relaxed\">${apiDescription.replace(/`/g,'')}\n        </p>\n      </CardBody>\n      <CardFooter className=\"pt-2 flex justify-end\">\n        <Button color=\"primary\" variant=\"solid\">Action</Button>\n      </CardFooter>\n    </Card>\n  );\n}`;

    const usageExample = `// Usage Example\n<${componentName} ${(props||[]).map(p => `${p.name}={/* ${p.type} */}`).join(' ')} />`;

    const stylingNotes = `Uses Tailwind utility classes for layout, spacing, colors and rounded corners. Extend by passing className to root <Card>. Provide composition slots if needed. ${styling}`;

    return {
      componentName,
      code: componentCode,
      usage: usageExample,
      propsDefinition: propsInterface,
      stylingNotes
    };
  }
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = await streamText({
    model: znapai('gpt-4o-mini'),
    messages: convertToModelMessages(messages),
    tools: { browseDocumentation, generateComponent }
  });

  return result.toTextStreamResponse();
}