// app/actions.tsx (enhanced component generation)
'use server';

import { streamUI } from '@ai-sdk/rsc';
import { znapai } from '@/lib/znapai';
import { tvly } from '@/lib/tavily';
import { z } from 'zod';
import { Card, CardBody } from '@heroui/react';

// Loading component
const LoadingComponent = () => (
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

// Enhanced component generation with Tavily research
export async function generateComponentWithResearch(params: {
  componentName: string;
  apiDescription: string;
  researchQuery?: string;
  props?: unknown[];
  styling?: string;
}) {
  // Research additional context if provided
  let researchContext = '';
  if (params.researchQuery) {
    try {
      const response = await tvly.search(params.researchQuery, {
        search_depth: "advanced",
        max_results: 3,
        include_answer: true,
      });
      
      researchContext = `
Additional Research Context:
Query: ${params.researchQuery}
AI Summary: ${response.answer || 'No summary available'}
Sources: ${response.results.map((r: { title: string }) => r.title).join(', ')}
      `;
    } catch (error) {
      console.error('Research failed:', error);
    }
  }

  const result = await streamUI({
    model: znapai('gpt-4o-mini'),
    prompt: `Generate a React component called ${params.componentName} based on this API description: ${params.apiDescription}.
    
    ${researchContext}
    
    Requirements:
    - Use TypeScript with proper type definitions
    - Use TailwindCSS for styling
    - Use HeroUI components (not shadcn/ui)
    - Include proper error handling
    - Make it responsive
    - Add accessibility attributes
    ${params.styling || ''}
    
    ${params.props ? `Props: ${JSON.stringify(params.props, null, 2)}` : ''}
    `,
    text: ({ content }: { content: string }) => <div>{content}</div>,
    tools: {
      createComponent: {
        description: 'Create a React component with the specified parameters',
        inputSchema: z.object({
          code: z.string().describe('The React component code'),
          usage: z.string().describe('Usage example'),
          propsDefinition: z.string().describe('Props interface definition'),
          stylingNotes: z.string().describe('Styling and customization notes'),
        }),
        generate: async function* ({ code, usage, propsDefinition, stylingNotes }: { code: string; usage: string; propsDefinition: string; stylingNotes: string }) {
          yield <LoadingComponent />;
          
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          return (
            <div className="space-y-4">
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
                  <code>{code}</code>
                </pre>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Props Interface:</h4>
                  <pre className="text-sm bg-white p-2 rounded">{propsDefinition}</pre>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Usage Example:</h4>
                  <pre className="text-sm bg-white p-2 rounded">{usage}</pre>
                </div>
              </div>
              
              {stylingNotes && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Styling Notes:</h4>
                  <p className="text-sm">{stylingNotes}</p>
                </div>
              )}
            </div>
          );
        },
      },
    },
  });

  return result.value;
}