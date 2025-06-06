
import { createClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    process: {
      env: {
        [key: string]: string | undefined;
        API_KEY?: string;
        SUPABASE_URL?: string;
        SUPABASE_ANON_KEY?: string;
      };
    };
  }
}

const env = typeof window !== 'undefined' && window.process && window.process.env ? window.process.env : {};
const supabaseUrlFromEnv = env.SUPABASE_URL;
const supabaseAnonKeyFromEnv = env.SUPABASE_ANON_KEY;

let clientInstance: ReturnType<typeof createClient> | null = null;

if (!supabaseUrlFromEnv) {
  console.error(`Supabase URL is missing. This should be defined (e.g., in index.html for this setup). Supabase client will not be initialized.`);
} else if (!supabaseAnonKeyFromEnv) {
  console.error(`Supabase Anon Key is missing. This should be defined (e.g., in index.html for this setup). Supabase client will not be initialized.`);
} else {
  try {
    new URL(supabaseUrlFromEnv); 
    clientInstance = createClient(supabaseUrlFromEnv, supabaseAnonKeyFromEnv);
  } catch (e) {
    console.error(`The provided Supabase URL "${supabaseUrlFromEnv}" is invalid or client creation failed. Supabase client will not be initialized. Error: ${(e as Error).message}`);
  }
}

export const supabase = clientInstance;

// Helper type for Supabase table responses
export type DbResult<T> = T extends PromiseLike<infer U> ? U : never
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never
export type DbResultErr = { error: { message: string, details?: string, hint?: string, code?: string } }

// Define your database schema types for tables like 'tickets', etc.
// Example: export interface TicketSchema extends Ticket {}
