
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient'; // Import Supabase client
import type { SupabaseClient } from '@supabase/supabase-js';
import { HPDSKLogoIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';
import FeedbackAlert from './FeedbackAlert';
import type { AppFeedback } from '../App';

interface LoginPageProps {
  supabaseClient: SupabaseClient | null; // Allow null for robustness
  setGlobalAppFeedback: (feedback: AppFeedback | null) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ supabaseClient, setGlobalAppFeedback }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setGlobalAppFeedback(null);

    if (!supabaseClient) {
      setError("Erro de configuração: Cliente Supabase não está disponível.");
      setGlobalAppFeedback({ type: 'error', message: "Cliente Supabase não inicializado. Verifique a configuração." });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: signInError } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setGlobalAppFeedback({ type: 'error', message: `Falha no login: ${signInError.message}` });
      } else if (data.session) {
        // Session update will be handled by onAuthStateChange listener in App.tsx
        // No need to call onLoginSuccess explicitly if App.tsx listens to auth changes
        // Optionally, you could set a success message here, but usually, it's a redirect.
        // setGlobalAppFeedback({ type: 'success', message: "Login realizado com sucesso!" });
      } else {
        setError("Ocorreu um erro inesperado durante o login.");
        setGlobalAppFeedback({ type: 'error', message: "Ocorreu um erro inesperado durante o login."});
      }
    } catch (catchError: any) {
      setError(catchError.message || "Ocorreu uma exceção durante o login.");
      setGlobalAppFeedback({ type: 'error', message: `Erro: ${catchError.message || "Exceção no login."}`});
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 shadow-2xl rounded-xl p-8 space-y-6">
        <div className="flex flex-col items-center">
          <HPDSKLogoIcon className="w-20 h-20 mb-3 text-purple-500" />
          <h2 className="text-3xl font-bold text-center text-purple-400">Login HPDSK</h2>
          <p className="mt-1 text-center text-sm text-gray-400">
            Acesse sua conta para gerenciar o suporte.
          </p>
        </div>

        {error && (
          <FeedbackAlert type="error" message={error} onDismiss={() => setError(null)} />
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 sr-only">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
              placeholder="Seu endereço de e-mail"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 sr-only">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
              placeholder="Sua senha"
              disabled={isLoading}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="w-5 h-5 mr-2" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </div>
        </form>
        <p className="text-center text-xs text-gray-500 mt-6">
          Problemas para acessar? Contate o administrador do sistema.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
