# AI Chat Interface

Smart AI-powered chat interface for API documentation analysis and React component generation.

## Stack
- Framework: Next.js 15 with App Router
- Frontend: React + TypeScript + TailwindCSS
- AI Integration: ai-sdk.dev + OpenAI SDK
- UI Library: @heroui/react (not shadcn/ui)
- Search Integration: Tavily API

## Core Features
User Interface:
- Streaming real-time responses
- Syntax-highlighted code snippets
- Tool execution visualization

Documentation:
- API documentation browser
- Web search capabilities
- Content extraction & summarization

Component Generation:
- TypeScript React components
- Proper typing & interfaces
- Example usage code
- HeroUI integration

## Environment (.env.local)
```
TAVILY_API_KEY=your_tavily_api_key
ZnapAI_API_KEY=your_openai_api_key
```

## Quick Start
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

URLs:
- App: http://localhost:3000

## Chat API
```
POST /api/chat
{ "messages": [...] }
```

## Tools (automatic)
- browseDocumentation
  - Fetches and analyzes documentation from URLs
  - Can perform web searches with isSearch=true
- generateComponent
  - Creates TypeScript React components
  - Adds proper interfaces and type safety
  - Integrates with HeroUI components
  - Provides usage examples

## Example
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Generate a pricing card component"}]}'
```

## Usage Examples

### Documentation Browser
- "Tell me about the billing APIs on billingsdk.com"
- "Search for payment processing in dodopayments.com"
- "Find documentation on recurring billing"

### Component Generation
- "Generate a pricing card component for a billing system"
- "Create a payment form component with credit card validation"
- "Make a subscription plan selector component with monthly/yearly toggle"

### Integration Guidance
- "How can I integrate billingsdk.com with dodopayments.com?"
- "What's the best way to connect a billing system to a payment processor?"
- "Show me how to handle webhooks from a payment provider"

## Troubleshooting
- No API response: Check API keys in .env.local file
- Component generation issues: Verify HeroUI is properly installed
- Documentation browser errors: Ensure valid URL format or search query