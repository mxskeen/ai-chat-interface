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

// Component generation tool with HeroUI integration
export const generateComponent = tool({
  description: 'Generate React components from API documentation with TypeScript and HeroUI/TailwindCSS',
  inputSchema: z.object({
    componentName: z.string().describe('Name of the component to generate'),
    apiDescription: z.string().describe('Description of the API functionality'),
    apiDocUrl: z.string().optional().describe('URL of the API documentation'),
    props: z.array(z.object({
      name: z.string(),
      type: z.string(),
      required: z.boolean().default(false),
      description: z.string(),
      defaultValue: z.string().optional(),
    })).optional(),
    styling: z.string().describe('Styling preferences and requirements'),
    uiLibrary: z.string().default('heroui').describe('UI library to use (default: heroui)'),
    theme: z.string().optional().describe('Theme or color scheme to use'),
  }),
  execute: async ({ componentName, apiDescription, apiDocUrl, props, styling, uiLibrary, theme }) => {
    // Generate React component with typed props and validation
    const typedProps = props || [];
    
    // Generate TypeScript interfaces
    const propsInterface = `interface ${componentName}Props {
  ${typedProps.map(prop => 
    `${prop.name}${prop.required ? '' : '?'}: ${prop.type}; ${prop.description ? `// ${prop.description}` : ''}`
  ).join('\n  ')}
}`;
    
    // Generate component code using HeroUI components
    const componentCode = `import { FC } from 'react';
import { Card, Button, Input, Select, Badge } from '@heroui/react';

${propsInterface}

/**
 * ${componentName} - ${apiDescription}
 * 
 * @component
 * @example
 * return (
 *   <${componentName} 
 *     ${typedProps.filter(p => p.required).map(p => `${p.name}={${getExampleValue(p)}}`).join('\n *     ')}
 *   />
 * )
 */
export const ${componentName}: FC<${componentName}Props> = ({
  ${typedProps.map(p => `${p.name}${p.defaultValue ? ` = ${p.defaultValue}` : ''}`).join(',\n  ')}
}) => {
  return (
    <Card className="rounded-lg shadow-md ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'}">
      <div className="p-6">
        {/* Component implementation based on API description */}
        <h3 className="text-xl font-semibold mb-4">${componentName}</h3>
        
        {/* Generated UI based on props */}
        ${generateUIBasedOnProps(typedProps, styling)}
      </div>
    </Card>
  );
};`;

    // Generate usage example
    const usageExample = `// Example usage of ${componentName}
import { ${componentName} } from './path-to/${componentName}';

export function ExampleUsage() {
  return (
    <div className="max-w-md mx-auto my-8">
      <${componentName}
        ${typedProps.filter(p => p.required).map(p => `${p.name}={${getExampleValue(p)}}`).join('\n        ')}
      />
    </div>
  );
}`;
    
    return {
      componentName,
      code: componentCode,
      usage: usageExample,
      documentation: apiDocUrl,
    };
  },
});

// Helper function to generate UI elements based on prop types
function generateUIBasedOnProps(props: Array<any>, styling: string): string {
  if (!props.length) {
    return `<div className="p-4">
          <p>Component content will be displayed here.</p>
          <Button color="primary" className="mt-4">Action</Button>
        </div>`;
  }

  // Generate UI elements based on prop types
  const uiElements = props.map(prop => {
    const propName = prop.name;
    const propType = prop.type.toLowerCase();
    
    if (propType.includes('string') && (propName.includes('title') || propName.includes('name'))) {
      return `<h4 className="font-semibold text-lg">{${propName} || 'Title'}</h4>`;
    }
    
    if (propType.includes('string') && (propName.includes('description') || propName.includes('text'))) {
      return `<p className="text-sm mt-2">{${propName} || 'Description text'}</p>`;
    }
    
    if (propType.includes('number') && (propName.includes('price') || propName.includes('amount'))) {
      return `<div className="text-xl font-bold mt-3">{${propName} ? \`\$\${${propName}.toFixed(2)}\` : '$0.00'}</div>`;
    }
    
    if (propType.includes('array') && propName.includes('features')) {
      return `<ul className="mt-3 space-y-1">
          {${propName}?.map((feature, index) => (
            <li key={index} className="flex items-center">
              <Badge color="success" className="mr-2">✓</Badge>
              <span>{feature}</span>
            </li>
          ))}
        </ul>`;
    }
    
    if (propType.includes('boolean') && (propName.includes('enabled') || propName.includes('active'))) {
      return `<div className="mt-2">
          <Badge color={${propName} ? 'success' : 'error'}>
            {${propName} ? 'Active' : 'Inactive'}
          </Badge>
        </div>`;
    }
    
    return '';
  }).filter(Boolean).join('\n        ');
  
  return uiElements || `<div className="p-4">
          <p>Component content will be displayed here.</p>
          <Button color="primary" className="mt-4">Action</Button>
        </div>`;
}

// Helper function to generate example values based on prop types
function getExampleValue(prop: any): string {
  const propType = prop.type.toLowerCase();
  
  if (propType.includes('string')) {
    if (prop.name.includes('title') || prop.name.includes('name')) {
      return `"Example Title"`;
    }
    if (prop.name.includes('description')) {
      return `"This is an example description"`;
    }
    return `"example"`;
  }
  
  if (propType.includes('number')) {
    if (prop.name.includes('price')) {
      return '19.99';
    }
    return '42';
  }
  
  if (propType.includes('boolean')) {
    return 'true';
  }
  
  if (propType.includes('array')) {
    if (prop.name.includes('features')) {
      return `["Feature 1", "Feature 2", "Feature 3"]`;
    }
    return '[]';
  }
  
  if (propType.includes('object')) {
    return '{}';
  }
  
  return 'undefined';
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  
  const result = streamText({
    model: znapai('gpt-4o-mini'),
    system: `You are an AI assistant specializing in API documentation analysis and React component generation.

BROWSING CAPABILITIES:
- When users ask about API documentation or want to learn about APIs like billingsdk.com or dodopayments.com, use the browseDocumentation tool.
- For general search queries about APIs, use browseDocumentation with isSearch=true.
- Always summarize API documentation in a clear, structured way highlighting key endpoints, parameters, and usage patterns.

COMPONENT GENERATION CAPABILITIES:
- When asked to generate components, use the generateComponent tool to create TypeScript React components.
- Generated components should use the @heroui/react library (not shadcn/ui).
- Components should be fully typed with proper TypeScript interfaces and prop validation.
- Pay special attention to creating components that follow best practices:
  * Clear prop interfaces with documentation comments
  * Responsive layouts using Tailwind CSS
  * Properly styled using HeroUI components
  * Functional with proper TypeScript typing

INTEGRATION EXPERTISE:
- When asked about integrating multiple APIs (like billingsdk.com with dodopayments.com), provide step-by-step guidance.
- Explain API integration patterns, focusing on:
  * Authentication requirements
  * Data flow between systems
  * Error handling approaches
  * Best practices for connecting payment processors with billing systems

Always be thorough in your explanations but focus on practical implementation details rather than theory.`,
    messages: convertToModelMessages(messages),
    tools: {
      browseDocumentation,
      generateComponent,
    },
  });

  return result.toUIMessageStreamResponse();
}