export type AppState = 'menu' | 'input' | 'processing' | 'result' | 'conversation';

export interface Action {
  id: string;
  label: string;
  description: string;
}

export interface ClaudeResponse {
  success: boolean;
  result?: string;
  error?: string;
  sessionId?: string;
}

export interface ClaudeQueryOptions {
  prompt: string | AsyncIterable<any>;
  maxTurns?: number;
  allowedTools?: string[];
  onHook?: (type: string, data: any) => void;
  continueSession?: boolean;
  resumeSessionId?: string;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | any[];
}