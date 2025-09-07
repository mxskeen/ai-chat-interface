#!/bin/bash

echo "Starting AI Chat Interface"
echo "========================="
echo ""
echo "Setting up environment..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "Creating .env.local file. Please edit it with your API keys."
  echo "TAVILY_API_KEY=your_tavily_api_key" > .env.local
  echo "ZnapAI_API_KEY=your_openai_api_key" >> .env.local
  echo ""
  echo "⚠️ Please edit .env.local with your actual API keys before continuing."
  read -p "Press enter to continue after editing..."
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start development server
echo "Starting development server..."
npm run dev
