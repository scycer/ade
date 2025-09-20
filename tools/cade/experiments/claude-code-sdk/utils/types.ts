import type {
  SDKMessage,
  Options,
  Query
} from '@anthropic-ai/claude-code';

export interface ExperimentConfig {
  name: string;
  description: string;
  expectedMessageTypes: string[];
}

export interface ExperimentResult {
  success: boolean;
  messages: SDKMessage[];
  error?: Error;
  metrics?: any;
}

export type SetupFunction = (prompt: string, options?: Options) => Query;
export type TesterFunction = (setup: SetupFunction) => Promise<ExperimentResult>;