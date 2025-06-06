
import { GoogleGenAI, Chat, GenerateContentResponse, Content } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';
import { Message } from '../types'; // Message type might not be needed here anymore if history is passed differently

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
const API_KEY_FROM_ENV = env.API_KEY;

let ai: GoogleGenAI | null = null;
export let geminiInitializationError: string | null = null; 

if (!API_KEY_FROM_ENV) { 
  geminiInitializationError = `API_KEY for Gemini is missing. It should be set (e.g., in index.html for this setup). Gemini features will be unavailable.`;
  console.error(geminiInitializationError, "Current value (should not be undefined):", API_KEY_FROM_ENV);
} else {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY_FROM_ENV });
  } catch (error) {
     geminiInitializationError = `Failed to initialize Gemini AI client: ${(error as Error).message}`;
     console.error(geminiInitializationError, "API Key used:", API_KEY_FROM_ENV ? "Exists" : "Missing");
     ai = null; 
  }
}

export const isAiAvailable = (): boolean => !!ai && !geminiInitializationError;

export const createChat = (
    systemInstruction: string, 
    initialHistory: Content[] = [] // Uses Content type from @google/genai
): Chat | null => {
  if (!isAiAvailable()) {
    console.error("Gemini AI client not initialized or error occurred:", geminiInitializationError);
    return null;
  }
  try {
    return ai!.chats.create({
      model: GEMINI_MODEL_NAME,
      config: {
        systemInstruction: systemInstruction,
      },
      history: initialHistory,
    });
  } catch (error) {
    console.error("Error creating new chat session with Gemini:", error);
    return null;
  }
};

export const generateStream = async (
    chat: Chat, 
    prompt: string
): Promise<AsyncIterableIterator<GenerateContentResponse> | null> => {
  if (!isAiAvailable()) {
    console.error("Gemini AI client not initialized.", geminiInitializationError);
    async function* errorStream() {
        const errorMessage = geminiInitializationError || "Cliente Gemini não inicializado.";
        yield { text: `Erro: ${errorMessage}` } as any; 
    }
    return errorStream();
  }
  if (!chat) {
    console.error("Chat object is null or undefined.");
    async function* errorStream() {
        yield { text: "Erro: Objeto de chat inválido." } as any;
    }
    return errorStream();
  }
  try {
    return chat.sendMessageStream({ message: prompt });
  } catch (error) {
    console.error("Error sending message to chat stream:", error);
     async function* errorStream() {
        yield { text: `Erro ao contatar Gemini: ${(error as Error).message}` } as any;
    }
    return errorStream();
  }
};

export const generateText = async (
  prompt: string,
  systemInstruction?: string,
  model: string = GEMINI_MODEL_NAME
): Promise<GenerateContentResponse> => {
  if (!isAiAvailable()) {
    console.error("Gemini AI client not initialized.", geminiInitializationError);
    throw new Error(geminiInitializationError || "Cliente Gemini não inicializado. Não é possível gerar texto.");
  }
  
  const contents: Content[] = [{ role: "user", parts: [{text: prompt}] }];
  
  try {
    // For generateContent, systemInstruction is part of the config object
    const response = await ai!.models.generateContent({
        model: model,
        contents: contents, // Correctly pass contents array
        config: systemInstruction ? { systemInstruction } : undefined,
    });
    return response;
  } catch (error) {
    console.error("Error generating text with Gemini:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
};
