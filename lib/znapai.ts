// lib/znapai.ts
import OpenAI from 'openai';

export const znapai = new OpenAI({
  apiKey: process.env.ZnapAI_API_KEY || '',
  baseURL: "https://api.znapai.com/",
});