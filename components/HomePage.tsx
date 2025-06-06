import React from 'react';
import { HPDSKLogoIcon } from './icons'; // Removed PlusIcon as it's no longer used directly here
import type { ViewMode } from '../types'; 
import type { NavigationItemConfig } from '../types'; 

interface HomePageProps {
  onNavigate: (viewMode: ViewMode) => void;
  navItems: NavigationItemConfig[]; 
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate, navItems }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-800 rounded-lg shadow-xl text-center">
      <HPDSKLogoIcon className="w-24 h-24 mb-6" />
      <h1 className="text-4xl font-bold text-purple-400 mb-4">Bem-vindo ao HPDSK!</h1>
      <p className="text-lg text-gray-300 mb-8 max-w-2xl">
        Sua solução centralizada para gerenciamento de tickets de suporte de TI, agora com o poder da Inteligência Artificial para agilizar diagnósticos e resoluções.
      </p>
      
      {/* "Novo Ticket" button removed from here */}
      
      {/* Dynamically generated navigation buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-4xl mt-8"> {/* Added mt-8 for spacing after removing novo ticket button */}
        {navItems.map(item => (
          <button
            key={item.viewMode}
            onClick={() => onNavigate(item.viewMode)}
            className={`${item.colorClass || 'bg-purple-500 hover:bg-purple-600'} text-white font-medium py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center text-base`}
            aria-label={`Ir para ${item.label}`}
          >
            <item.icon className="w-5 h-5 mr-2" />
            {item.label}
          </button>
        ))}
      </div>
      
      <p className="text-sm text-gray-500 mt-12">
        Explore as seções acima ou clique no logo HPDSK na barra lateral a qualquer momento para retornar a esta página.
      </p>
    </div>
  );
};

export default HomePage;