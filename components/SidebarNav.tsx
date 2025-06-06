
import React from 'react';
import {
    HPDSKLogoIcon, Bars3Icon, ArrowLeftIcon, LifebuoyIcon, ArrowRightOnRectangleIcon
} from './icons';
import type { ViewMode, NavigationItemConfig } from '../types'; 

interface SidebarNavProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  currentView: ViewMode;
  onNavigate: (viewMode: ViewMode) => void;
  navItems: NavigationItemConfig[]; 
  onLogout: () => void;
}

const NavItem: React.FC<{
  viewMode: ViewMode;
  currentView: ViewMode;
  onNavigate: (viewMode: ViewMode) => void;
  icon: React.ReactNode;
  label: string;
  isSidebarOpen: boolean;
}> = ({ viewMode, currentView, onNavigate, icon, label, isSidebarOpen }) => {
  const isActive = 
    currentView === viewMode ||
    (viewMode === 'list' && (currentView === 'detail' || currentView === 'form')) ||
    (viewMode === 'tasks' && currentView === 'taskForm') ||
    (viewMode === 'inventoryDashboard' && (
        currentView === 'inventoryStockList' || 
        currentView === 'inventoryDeployedList' ||
        currentView === 'inventoryItemForm' ||
        currentView === 'inventoryDashboard' 
    )) ||
    (viewMode === 'contractsList' && currentView === 'contractForm');


  const baseClasses = "flex items-center w-full text-left px-3 py-3 rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-400";
  const activeClasses = "bg-purple-600 text-white"; 
  const inactiveClasses = "text-gray-300 hover:bg-gray-700 hover:text-white";

  return (
    <li>
      <button
        onClick={() => onNavigate(viewMode)}
        className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
        aria-current={isActive ? 'page' : undefined}
        title={label}
      >
        <span className={`flex-shrink-0 w-6 h-6 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`}>{icon}</span>
        {isSidebarOpen && <span className="truncate text-sm font-medium">{label}</span>}
      </button>
    </li>
  );
};


const SidebarNav: React.FC<SidebarNavProps> = ({ 
    isOpen, toggleSidebar, currentView, onNavigate, navItems, onLogout
}) => {
  const sidebarWidth = isOpen ? 'w-60' : 'w-20';

  // Add Help to navItems if not already present by App.tsx mainNavItemsConfig
  const completeNavItems = [...navItems];
  if (!navItems.find(item => item.viewMode === 'help')) {
      completeNavItems.push({
          viewMode: 'help',
          label: 'Ajuda',
          icon: LifebuoyIcon, // Assuming LifebuoyIcon is imported
      });
  }


  return (
    <aside className={`bg-black text-white flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out print:hidden ${sidebarWidth}`}>
      <button
        onClick={() => onNavigate('home')}
        className={`flex items-center w-full text-left ${isOpen ? 'px-4' : 'px-2 justify-center'} h-16 border-b border-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors duration-150 ease-in-out`}
        aria-label="Ir para a Página Inicial"
        title="Página Inicial"
      >
        <HPDSKLogoIcon className={`flex-shrink-0 ${isOpen ? 'w-8 h-8' : 'w-9 h-9'}`} />
        {isOpen && <span className="ml-2 text-xl font-semibold truncate text-white">HPDSK</span>}
      </button>

      <nav className="flex-grow p-3 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
        <ul>
          {completeNavItems.map(item => ( // Use completeNavItems
            <NavItem 
            key={item.viewMode}
            viewMode={item.viewMode}
            currentView={currentView}
            onNavigate={onNavigate}
            icon={<item.icon />}
            label={item.label}
            isSidebarOpen={isOpen}
            />
          ))}
        </ul>
      </nav>

      <div className="p-3 border-t border-gray-700">
         <button
          onClick={onLogout}
          className="mb-2 w-full flex items-center px-3 py-3 text-gray-300 hover:bg-red-700 hover:text-white rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label="Sair da aplicação"
          title="Sair"
        >
          <ArrowRightOnRectangleIcon className={`flex-shrink-0 w-6 h-6 ${isOpen ? 'mr-3' : 'mx-auto'}`} />
          {isOpen && <span className="text-sm font-medium">Sair</span>}
        </button>
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center px-3 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-400"
          aria-label={isOpen ? "Recolher menu lateral" : "Expandir menu lateral"}
          aria-expanded={isOpen}
          title={isOpen ? "Recolher" : "Expandir"}
        >
          {isOpen ? <ArrowLeftIcon className="w-6 h-6 mr-3" /> : <Bars3Icon className="w-7 h-7 mx-auto" />}
          {isOpen && <span className="text-sm font-medium">Recolher</span>}
        </button>
      </div>
    </aside>
  );
};

export default SidebarNav;
