
// Placeholder constants are removed as keys are now directly embedded in index.html for this setup.
// The checks will now focus on whether the process.env variables are defined at all.

interface ConfigError {
  keyName: string;
  message: string;
  currentValue?: string | null;
}

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

export const configErrors: ConfigError[] = [];

// Access variables from window.process.env for browser environment
const env = typeof window !== 'undefined' && window.process && window.process.env ? window.process.env : {};

const supabaseUrl = env.SUPABASE_URL;
const supabaseAnonKey = env.SUPABASE_ANON_KEY;
const geminiApiKey = env.API_KEY;

console.log('[configStatus] Verificando SUPABASE_URL:', supabaseUrl);
console.log('[configStatus] Verificando SUPABASE_ANON_KEY:', supabaseAnonKey);
console.log('[configStatus] Verificando API_KEY (Gemini):', geminiApiKey);

// Check Supabase URL
if (!supabaseUrl) {
  configErrors.push({
    keyName: 'SUPABASE_URL',
    message: `Supabase URL (SUPABASE_URL) is not defined. This value is expected to be set (e.g., via the script in index.html for this application setup).`,
    currentValue: supabaseUrl
  });
} else {
  try {
    new URL(supabaseUrl); // Validate format if defined
  } catch (e) {
    configErrors.push({
      keyName: 'SUPABASE_URL',
      message: `The Supabase URL "${supabaseUrl}" (likely set in index.html) is invalid. Please ensure it's a complete and correct URL (e.g., https://your-project-ref.supabase.co). Error: ${(e as Error).message}`,
      currentValue: supabaseUrl
    });
  }
}

// Check Supabase Anon Key
if (!supabaseAnonKey) {
  configErrors.push({
    keyName: 'SUPABASE_ANON_KEY',
    message: `Supabase Anon Key (SUPABASE_ANON_KEY) is not defined. This value is expected to be set (e.g., via the script in index.html for this application setup).`,
    currentValue: supabaseAnonKey
  });
}

// Check Gemini API Key
if (!geminiApiKey) {
  configErrors.push({
    keyName: 'API_KEY',
    message: `Gemini API Key (API_KEY) is not defined. This value is expected to be set (e.g., via the script in index.html for this application setup).`,
    currentValue: geminiApiKey
  });
}

export const hasConfigErrors = configErrors.length > 0;
if (hasConfigErrors) {
    console.error('[configStatus] Erros de configuração encontrados:', JSON.stringify(configErrors, null, 2));
} else {
    console.log('[configStatus] Nenhuma erro de configuração detectado. Credentials should be sourced from index.html script.');
}