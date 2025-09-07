// app/api/chat/route.ts
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

// Browsing function using Tavily Extract and Search
async function browseDocumentation(url: string, isSearch = false) {
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
      // Use Tavily Extract to get content from specific URL
      try {
        const extractResponse = await tvly.extract([url], {
          extract_depth: "advanced",
          format: "markdown",
          include_images: false,
        });
        
        if (extractResponse.results && extractResponse.results.length > 0) {
          const extractedContent = extractResponse.results[0];
          result = {
            type: 'url',
            url: url,
            title: extractedContent.title || 'Documentation',
            content: extractedContent.content || '',
            rawContent: extractedContent.content || '',
          };
        } else {
          // Fallback to search if extract fails
        const domain = new URL(url).hostname;
        const searchQuery = `site:${domain} documentation`;
        
          const searchResponse = await tvly.search(searchQuery, {
          search_depth: "advanced",
          max_results: 5,
          include_answer: true,
          include_raw_content: true,
        });
        
        // Find the most relevant result matching the URL
          const relevantResult = searchResponse.results.find((item: SearchResult) => 
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
          result = {
            type: 'search',
            query: url,
              answer: searchResponse.answer,
              results: searchResponse.results,
            };
          }
        }
      } catch (extractError) {
        console.error('Tavily extract failed, falling back to search:', extractError);
        
        // Fallback to search if extract fails
        const domain = new URL(url).hostname;
        const searchQuery = `site:${domain} documentation`;
        
        const searchResponse = await tvly.search(searchQuery, {
          search_depth: "advanced",
          max_results: 5,
          include_answer: true,
          include_raw_content: true,
        });
        
        result = {
          type: 'search',
          query: searchQuery,
          answer: searchResponse.answer,
          results: searchResponse.results,
        };
        }
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to browse documentation: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// Component generation function with HeroUI integration
async function generateComponent(params: {
  componentName: string;
  apiDescription: string;
  apiDocUrl?: string;
  props?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    defaultValue?: string;
  }>;
  styling: string;
  uiLibrary?: string;
  theme?: string;
}) {
  const { componentName, apiDescription, apiDocUrl, props, styling, uiLibrary = 'heroui', theme } = params;
  
  // Generate React component with typed props and validation
  const typedProps = props || [];
  
  // Generate TypeScript interfaces
  const propsInterface = `interface ${componentName}Props {
${typedProps.map(prop => 
  `  ${prop.name}${prop.required ? '' : '?'}: ${prop.type}; ${prop.description ? `// ${prop.description}` : ''}`
).join('\n')}
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
}

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
  try {
    const body = await req.json();
    console.log('Request body:', body);
    
    const { messages } = body;
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if API keys are configured
    if (!process.env.ZnapAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ZnapAI API key not configured. Please set ZnapAI_API_KEY in your .env.local file.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Received messages:', messages.length);
    
    // Convert messages to the correct format
    const modelMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content || (msg.parts && msg.parts[0]?.text) || ''
    }));
    
    console.log('Model messages:', modelMessages);
    
    // Add system message
    const systemMessage = {
      role: 'system' as const,
      content: `You are an AI assistant specializing in API documentation analysis and React component generation.

BROWSING CAPABILITIES:
- When users ask about API documentation or want to learn about APIs like billingsdk.com or dodopayments.com, use the browseDocumentation function to fetch and analyze documentation.
- For general search queries about APIs, use browseDocumentation with isSearch=true.
- Always provide clear, structured summaries highlighting key endpoints, parameters, and usage patterns.

COMPONENT GENERATION CAPABILITIES:
- When asked to generate components, use the generateComponent function to create TypeScript React components using @heroui/react library (not shadcn/ui).
- Components should be fully typed with proper TypeScript interfaces and prop validation.
- Follow best practices:
  * Clear prop interfaces with documentation comments
  * Responsive layouts using Tailwind CSS
  * Properly styled using HeroUI components
  * Functional with proper TypeScript typing

INTEGRATION EXPERTISE:
- Provide step-by-step guidance for integrating APIs (like billingsdk.com with dodopayments.com).
- Explain API integration patterns focusing on:
  * Authentication requirements
  * Data flow between systems
  * Error handling approaches
  * Best practices for connecting payment processors with billing systems

Always use the available functions when appropriate and focus on practical implementation details rather than theory.`
    };
    
    const completion = await znapai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemMessage, ...modelMessages],
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
      tools: [
        {
          type: "function",
          function: {
            name: "browseDocumentation",
            description: "Browse and extract content from API documentation URLs or search for documentation",
            parameters: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "The URL of the API documentation to browse or search query",
                },
                isSearch: {
                  type: "boolean",
                  description: "Set to true if input is a search query instead of a URL",
                  default: false,
                },
              },
              required: ["url"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "generateComponent",
            description: "Generate React components from API documentation with TypeScript and HeroUI/TailwindCSS",
            parameters: {
              type: "object",
              properties: {
                componentName: {
                  type: "string",
                  description: "Name of the component to generate",
                },
                apiDescription: {
                  type: "string",
                  description: "Description of the API functionality",
                },
                props: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: { type: "string" },
                      required: { type: "boolean", default: false },
                      description: { type: "string" },
                      defaultValue: { type: "string" },
                    },
                    required: ["name", "type", "description"],
                  },
                },
                styling: {
                  type: "string",
                  description: "Styling preferences and requirements",
                },
              },
              required: ["componentName", "apiDescription", "styling"],
            },
          },
        },
      ],
      tool_choice: "auto",
    });

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let isControllerClosed = false;
        
        const safeEnqueue = (data: Uint8Array) => {
          if (!isControllerClosed) {
            try {
              controller.enqueue(data);
            } catch (error) {
              console.error('Controller enqueue error:', error);
              isControllerClosed = true;
            }
          }
        };
        
        try {
          let toolCalls = new Map(); // Store multiple tool calls by index
          let activeCalls = new Set(); // Track which calls are active
          
          for await (const chunk of completion) {
            if (isControllerClosed) break;
            
            const choice = chunk.choices[0];
            const delta = choice?.delta;
            
            // Handle text content
            if (delta?.content) {
              const data = `data: ${JSON.stringify({ type: 'text-delta', textDelta: delta.content })}\n\n`;
              safeEnqueue(encoder.encode(data));
            }
            
            // Handle function calls
            if (delta?.tool_calls) {
              for (const toolCall of delta.tool_calls) {
                const callIndex = toolCall.index || 0;
                
                if (!toolCalls.has(callIndex)) {
                  toolCalls.set(callIndex, {
                    name: '',
                    arguments: '',
                    complete: false
                  });
                }
                
                const currentCall = toolCalls.get(callIndex);
                
                if (toolCall.function) {
                  if (toolCall.function.name && !currentCall.name) {
                    currentCall.name = toolCall.function.name;
                    activeCalls.add(callIndex);
                    
                    // Send function call start indicator
                    const startData = `data: ${JSON.stringify({ 
                      type: 'tool-call-start', 
                      toolName: currentCall.name 
                    })}\n\n`;
                    safeEnqueue(encoder.encode(startData));
                  }
                  
                  if (toolCall.function.arguments) {
                    currentCall.arguments += toolCall.function.arguments;
                  }
                }
              }
            }
            
            // Process complete function calls
            if (choice?.finish_reason === 'tool_calls') {
              // Process all complete tool calls
              for (const [callIndex, callData] of toolCalls.entries()) {
                if (!callData.complete && callData.name && callData.arguments.trim()) {
                  try {
                    console.log(`Processing tool call ${callIndex}:`, callData.name, callData.arguments);
                    
                    // Parse arguments
                    const cleanArgs = callData.arguments.trim();
                    let args;
                    
                    try {
                      args = JSON.parse(cleanArgs);
                    } catch (parseError) {
                      console.error('JSON parse error for call', callIndex, parseError);
                      // Try to extract first complete JSON object
                      const jsonMatch = cleanArgs.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
                      if (jsonMatch) {
                        args = JSON.parse(jsonMatch[0]);
                      } else {
                        throw parseError;
                      }
                    }
                    
                    let result;
                    
                    if (callData.name === 'browseDocumentation') {
                      result = await browseDocumentation(args.url, args.isSearch || false);
                      
                      // Send browsing result
                      const resultData = `data: ${JSON.stringify({ 
                        type: 'tool-browseDocumentation',
                        state: 'output-available',
                        output: result
                      })}\n\n`;
                      safeEnqueue(encoder.encode(resultData));
                      
                    } else if (callData.name === 'generateComponent') {
                      result = await generateComponent(args);
                      
                      // Send component generation result
                      const resultData = `data: ${JSON.stringify({ 
                        type: 'tool-generateComponent',
                        state: 'output-available',
                        output: result
                      })}\n\n`;
                      safeEnqueue(encoder.encode(resultData));
                    }
                    
                    // Store result and mark as complete
                    callData.result = result;
                    callData.complete = true;
                    
                  } catch (funcError) {
                    console.error(`Function call error for ${callData.name}:`, funcError);
                    if (!isControllerClosed) {
                      const errorData = `data: ${JSON.stringify({ 
                        type: 'tool-error', 
                        toolName: callData.name,
                        errorText: funcError instanceof Error ? funcError.message : String(funcError)
                      })}\n\n`;
                      safeEnqueue(encoder.encode(errorData));
                    }
                    callData.complete = true;
                  }
                }
              }
              
              // Send completion message after all tools are processed
              const completedCalls = Array.from(toolCalls.values()).filter(call => call.complete);
              if (completedCalls.length > 0) {
                // Generate a comprehensive follow-up response based on tool results
                let followUpText = `\n\n✅ ${completedCalls.length} tool(s) executed successfully!\n\n`;
                
                const browsingCalls = completedCalls.filter(call => call.name === 'browseDocumentation');
                const componentCalls = completedCalls.filter(call => call.name === 'generateComponent');
                
                if (browsingCalls.length > 0) {
                  followUpText += `## 📚 Documentation Analysis\n\n`;
                  browsingCalls.forEach((call, index) => {
                    if (call.result) {
                      const result = call.result as any;
                      followUpText += `**${result.url || 'Documentation'}**\n`;
                      followUpText += `- Title: ${result.title || 'N/A'}\n`;
                      followUpText += `- Content Length: ${result.content?.length || 0} characters\n\n`;
                    }
                  });
                  
                  followUpText += `Based on the documentation analysis, I can help you create integrated components that work with both BillingSDK and DodoPayments.\n\n`;
                }
                
                if (componentCalls.length > 0) {
                  followUpText += `## ⚛️ Generated Components\n\n`;
                  componentCalls.forEach((call, index) => {
                    if (call.result) {
                      const result = call.result as any;
                      followUpText += `**${result.componentName || 'Component'}**\n`;
                      followUpText += `${result.description || 'React component generated successfully'}\n\n`;
                    }
                  });
                }
                
                // If no specific tools were called, provide general guidance
                if (browsingCalls.length === 0 && componentCalls.length === 0) {
                  followUpText += `## 🚀 Next Steps\n\n`;
                  followUpText += `I've executed the requested tools successfully. Here's what I can help you with:\n\n`;
                  followUpText += `1. **API Integration**: Analyze documentation and provide integration guidance\n`;
                  followUpText += `2. **Component Generation**: Create TypeScript React components with proper typing\n`;
                  followUpText += `3. **Step-by-step Implementation**: Provide detailed integration instructions\n\n`;
                  followUpText += `Would you like me to generate a specific component or analyze particular API endpoints?\n`;
                }
                
                // If we have both browsing and want component generation
                if (browsingCalls.length > 0 && componentCalls.length === 0) {
                  followUpText += `## 🛠️ Ready for Component Generation\n\n`;
                  followUpText += `Now that I've analyzed the documentation, I can generate:\n\n`;
                  followUpText += `1. **Pricing Card Components** - Display subscription tiers with proper styling\n`;
                  followUpText += `2. **Payment Integration Components** - Handle DodoPayments processing\n`;
                  followUpText += `3. **Billing Management Components** - Integrate with BillingSDK features\n`;
                  followUpText += `4. **Combined Integration Examples** - Show how to connect both systems\n\n`;
                  followUpText += `Would you like me to generate any specific components based on the documentation I just analyzed?\n`;
                }

                const completionData = `data: ${JSON.stringify({ 
                  type: 'text-delta', 
                  textDelta: followUpText
                })}\n\n`;
                safeEnqueue(encoder.encode(completionData));
              }
            }
          }
          
          if (!isControllerClosed) {
            safeEnqueue(encoder.encode(`data: ${JSON.stringify({ type: 'finish' })}\n\n`));
            safeEnqueue(encoder.encode('data: [DONE]\n\n'));
          }
        } catch (error) {
          console.error('Streaming error:', error);
          if (!isControllerClosed) {
            const errorData = `data: ${JSON.stringify({ type: 'error', errorText: error instanceof Error ? error.message : String(error) })}\n\n`;
            safeEnqueue(encoder.encode(errorData));
          }
        } finally {
          if (!isControllerClosed) {
            try {
              controller.close();
            } catch (closeError) {
              console.error('Controller close error:', closeError);
            }
            isControllerClosed = true;
          }
        }
    },
  });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request: ' + (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}