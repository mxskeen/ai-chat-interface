// lib/znapai.ts
import { createOpenAI } from '@ai-sdk/openai';

export const znapai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: "https://api.znapai.com/v1",
  headers: {
    "Content-Type": "application/json",
  },
});