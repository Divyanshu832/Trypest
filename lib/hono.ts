import { hc } from "hono/client";

import { AppType } from "@/app/api/[[...route]]/route";

// Ensure URL has proper format with protocol
const formatUrl = (url: string) => {
  // If URL already has a protocol, return it as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // If we're in production (Vercel), use HTTPS
  if (process.env.NODE_ENV === 'production') {
    return `https://${url.replace(/^\/*/, '')}`;
  }
  // For development, use HTTP
  return `http://${url.replace(/^\/*/, '')}`;
};

// Default to localhost if no URL is provided or if URL is just a slash
const apiBaseUrl = (process.env.NEXT_PUBLIC_APP_URL === '/' || !process.env.NEXT_PUBLIC_APP_URL) 
  ? 'http://localhost:3000' 
  : formatUrl(process.env.NEXT_PUBLIC_APP_URL);

export const client = hc<AppType>(apiBaseUrl);
