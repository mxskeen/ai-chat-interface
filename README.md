# AI Chat Interface with Browsing & Component Generation

This project provides an AI-powered chat interface that enables real-time interactions, integrates a browsing tool for API documentation, and generates React component code snippets from API documentation pages.

## Features

### 1. Chat Interface
- **Streaming Response**: Delivers real-time, token-by-token AI responses
- **Syntax-Highlighted Code Snippets**: Automatic formatting of code blocks
- **Visual Indicators**: Shows when the AI is thinking or browsing

### 2. Browsing Tool
- **Documentation Analyzer**: Fetches and summarizes content from API documentation URLs
- **Search Capability**: Allows searching for relevant documentation
- **Content Extraction**: Pulls out key information from API docs

### 3. Component Generation
- **React Components**: Creates TypeScript React components with proper typing
- **HeroUI Integration**: Components styled with HeroUI components (not shadcn/ui)
- **Usage Examples**: Includes example code for implementing generated components

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **AI Integration**: ai-sdk.dev for chat orchestration and tool integration
- **UI Library**: @heroui/react - A modern React UI library with beautiful components
- **TypeScript**: Fully typed codebase for better developer experience
- **TailwindCSS**: For responsive styling and consistent design
- **React Syntax Highlighter**: For code block formatting

## Setup Instructions

### Prerequisites
- Node.js 18.x or later
- npm or yarn

### Environment Variables
Create a `.env.local` file in the root directory with the following variables:
```
TAVILY_API_KEY=your_tavily_api_key
ZnapAI_API_KEY=your_openai_api_key
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Usage Examples

### Browsing API Documentation
Try asking:
- "Tell me about the billing APIs on billingsdk.com"
- "Search for payment processing in dodopayments.com"
- "Find documentation on recurring billing"

### Generating Components
Try asking:
- "Generate a pricing card component for a billing system"
- "Create a payment form component with credit card validation"
- "Make a subscription plan selector component with monthly/yearly toggle"

### Integration Guidance
Try asking:
- "How can I integrate billingsdk.com with dodopayments.com?"
- "What's the best way to connect a billing system to a payment processor?"
- "Show me how to handle webhooks from a payment provider"

## UI Library Choice: HeroUI

This project uses [@heroui/react](https://hero-ui.com/) instead of shadcn/ui for several reasons:

- **Rich Component Library**: HeroUI provides a comprehensive set of pre-built components
- **TypeScript Support**: Fully typed components for better developer experience
- **Customization**: Easily themeable with Tailwind CSS
- **Modern Design**: Clean, professional aesthetic that works well for dashboards and admin interfaces

HeroUI components used in this project include:
- Card, CardBody for message containers and content blocks
- Button for actions and submissions
- Input for the chat input field
- Badge for status indicators

## Notes on Tools and Workflows

### Browsing Tool Implementation
The browsing tool uses Tavily's API to search and extract content from API documentation sites. It can:
- Process direct URLs to extract relevant content
- Perform targeted searches within specific domains
- Present summarized information with links to source material

### Component Generation Approach
The component generator:
1. Analyzes API requirements from documentation
2. Creates TypeScript interfaces for props
3. Implements components using HeroUI library
4. Generates example usage code
5. Provides JSDoc comments for better documentation

### Trade-offs and Design Choices

- **HeroUI vs shadcn/ui**: Chose HeroUI for its comprehensive component library and ease of integration
- **Tavily API**: Used for web search and content extraction instead of implementing custom scraping
- **TypeScript**: Prioritized type safety throughout, adding minimal overhead but greatly improving maintainability
- **Component Structure**: Generated components are standalone with proper TypeScript interfaces rather than complex compositions to maintain clarity

## Future Improvements

- Live preview panel for generated components
- More advanced API documentation parsing
- Additional UI library options
- Enhanced code explanation capabilities
- Support for more complex component generation scenarios

## Time Spent

Development time: Approximately 7 hours
- Research and planning: 1 hour
- Core chat interface: 2 hours
- Browsing tool integration: 1.5 hours
- Component generation: 2 hours
- Documentation and polish: 0.5 hours