// lib/tavily.ts
import { tavily } from "@tavily/core";

export const tvly = tavily({ 
  apiKey: process.env.TAVILY_API_KEY || "tvly-YOUR_API_KEY" 
});