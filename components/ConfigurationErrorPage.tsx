
import React from 'react';
import { ExclamationTriangleIcon } from './icons';
import { configErrors } from '../services/configStatus';

const ConfigurationErrorPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-gray-100"> {/* Main BG, text color */}
      <div className="bg-gray-800 shadow-2xl rounded-lg p-8 max-w-2xl w-full"> {/* Card BG */}
        <div className="text-center mb-6">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" /> {/* Red icon kept for error */}
          <h1 className="text-3xl font-bold text-red-500">Erro de Configuração</h1> {/* Red text kept for error */}
          <p className="text-gray-400 mt-2"> {/* Text color */}
            O aplicativo não pode ser iniciado corretamente devido a problemas de configuração.
          </p>
        </div>

        <div className="space-y-4">
          {configErrors.map((error, index) => (
            <div key={index} className="p-4 border border-red-400 bg-red-900/30 rounded-md"> {/* Error item BG and border */}
              <h2 className="text-lg font-semibold text-red-300">Problema com: <code className="bg-red-800/50 px-1 rounded">{error.keyName}</code></h2> {/* Text and code BG */}
              <p className="text-sm text-red-400 mt-1">{error.message}</p> {/* Text color */}
              {error.currentValue && (
                <p className="text-xs text-gray-500 mt-2"> {/* Text color */}
                  Valor atual detectado: <code className="bg-red-800/50 px-1 rounded break-all">{error.currentValue}</code> {/* Code BG */}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400"> {/* Text color */}
            Por favor, verifique suas variáveis de ambiente ou o arquivo <code className="bg-gray-700 px-1 rounded">index.html</code> (para configurações de desenvolvimento local) e certifique-se de que todas as chaves e URLs necessárias estejam corretas e não sejam os valores de placeholder.
          </p>
          <p className="text-sm text-gray-400 mt-2"> {/* Text color */}
            Após corrigir a configuração, atualize a página.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationErrorPage;
