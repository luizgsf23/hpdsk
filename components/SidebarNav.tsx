
import React from 'react';
import {
    HPDSKLogoIcon, Bars3Icon, ArrowLeftIcon, LifebuoyIcon, ArrowRightOnRectangleIcon, XMarkIcon
} from './icons';
import type { ViewMode, NavigationItemConfig } from '../types'; 

interface SidebarNavProps {
  isOpen: boolean; // Controls visibility for both mobile and desktop
  isMobile: boolean; // True if mobile view
  toggleSidebar: () => void; // For desktop collapse/expand and mobile close via internal button
  currentView: ViewMode;
  onNavigate: (viewMode: ViewMode) => void;
  navItems: NavigationItemConfig[]; 
  onLogout: () => void;
  closeMobileMenu: () => void; // Specifically for closing mobile overlay
}

const NavItem: React.FC<{
  viewMode: ViewMode;
  currentView: ViewMode;
  onNavigate: (viewMode: ViewMode) => void;
  icon: React.ReactNode;
  label: string;
  isSidebarOpen: boolean; // Based on isOpen and whether it should show text
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
    isOpen, isMobile, toggleSidebar, currentView, onNavigate, navItems, onLogout, closeMobileMenu
}) => {
  const sidebarWidthClass = isMobile ? 'w-64' : (isOpen ? 'w-60' : 'w-20');
  const transformClass = isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : '';
  
  // Determine if labels should be shown (always for mobile open, conditional for desktop)
  const showLabels = isMobile ? true : isOpen;

  // Add Help to navItems if not already present by App.tsx mainNavItemsConfig
  const completeNavItems = [...navItems];
  if (!navItems.find(item => item.viewMode === 'help')) {
      completeNavItems.push({
          viewMode: 'help',
          label: 'Ajuda',
          icon: LifebuoyIcon, 
      });
  }

  return (
    <aside 
        className={`
            bg-black text-white flex flex-col h-screen transition-all duration-300 ease-in-out print:hidden
            ${sidebarWidthClass}
            ${isMobile ? `fixed inset-y-0 left-0 z-40 transform ${transformClass}` : 'sticky top-0'}
        `}
    >
      <div className={`flex items-center justify-between w-full ${showLabels ? 'px-4' : 'px-2 justify-center'} h-16 border-b border-gray-700`}>
        <button
            onClick={() => onNavigate('home')}
            className={`flex items-center hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors duration-150 ease-in-out rounded-md p-1 ${showLabels ? '' : 'w-full justify-center'}`}
            aria-label="Ir para a Página Inicial"
            title="Página Inicial"
        >
            <HPDSKLogoIcon className={`flex-shrink-0 ${showLabels ? 'w-8 h-8' : 'w-9 h-9'}`} />
            {showLabels && <span className="ml-2 text-xl font-semibold truncate text-white">HPDSK</span>}
        </button>
        {isMobile && isOpen && (
             <button 
                onClick={closeMobileMenu} 
                className="text-gray-400 hover:text-white p-1"
                aria-label="Fechar menu"
            >
                <XMarkIcon className="w-6 h-6"/>
            </button>
        )}
      </div>


      <nav className="flex-grow p-3 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
        <ul>
          {completeNavItems.map(item => (
            <NavItem 
            key={item.viewMode}
            viewMode={item.viewMode}
            currentView={currentView}
            onNavigate={onNavigate}
            icon={<item.icon />}
            label={item.label}
            isSidebarOpen={showLabels} // Pass whether labels should be shown
            />
          ))}
        </ul>
      </nav>

      <div className="p-3 border-t border-gray-700">
         <button
          onClick={onLogout}
          className={`mb-2 w-full flex items-center px-3 py-3 text-gray-300 hover:bg-red-700 hover:text-white rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-400`}
          aria-label="Sair da aplicação"
          title="Sair"
        >
          <ArrowRightOnRectangleIcon className={`flex-shrink-0 w-6 h-6 ${showLabels ? 'mr-3' : 'mx-auto'}`} />
          {showLabels && <span className="text-sm font-medium">Sair</span>}
        </button>
        {!isMobile && ( // Desktop toggle button for collapse/expand
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
        )}
      </div>
    </aside>
  );
};

export default SidebarNav;
