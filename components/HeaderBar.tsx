import React from 'react';
import { Bars3Icon, HPDSKLogoIcon } from './icons';

interface HeaderBarProps {
  onToggleSidebar: () => void;
  pageTitle: string;
}

const HeaderBar: React.FC<HeaderBarProps> = ({ onToggleSidebar, pageTitle }) => {
  return (
    <div className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-gray-800 px-4 shadow-md md:hidden print:hidden">
      <button
        onClick={onToggleSidebar}
        className="text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 p-2 rounded-md"
        aria-label="Abrir menu lateral"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>
      <div className="flex items-center">
        <HPDSKLogoIcon className="w-7 h-7 mr-2 text-purple-500" />
        <h1 className="text-lg font-semibold text-purple-400 truncate">{pageTitle}</h1>
      </div>
      <div className="w-8"> {/* Spacer to balance the hamburger icon */}</div>
    </div>
  );
};

export default HeaderBar;
