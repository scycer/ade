export type AppState = 'menu' | 'input' | 'processing' | 'result';

export interface Action {
  id: string;
  label: string;
  description: string;
}

export interface ClaudeResponse {
  success: boolean;
  result?: string;
  error?: string;
}

export interface ClaudeQueryOptions {
  prompt: string;
  maxTurns?: number;
  allowedTools?: string[];
}