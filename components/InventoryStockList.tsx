
import React from 'react';
import { EquipmentItem, ViewMode, EquipmentStatus } from '../types';
import { CubeTransparentIcon, PlusIcon, PencilSquareIcon, InformationCircleIcon } from './icons';
import LoadingSpinner from './LoadingSpinner'; // Assuming LoadingSpinner exists

interface InventoryStockListProps {
  equipmentItems: EquipmentItem[];
  onNavigate: (viewMode: ViewMode) => void;
  onEditItem: (itemId: string) => void;
  onAddItem: () => void;
  isLoading: boolean;
}

const InventoryStockList: React.FC<InventoryStockListProps> = ({ equipmentItems, onNavigate, onEditItem, onAddItem, isLoading }) => {
  // Placeholder for more advanced filtering and sorting
  const stockItems = equipmentItems.filter(
    item => item.status === EquipmentStatus.EM_ESTOQUE || item.status === EquipmentStatus.PEDIDO
  );

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-gray-900 rounded-lg shadow-xl h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-700">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-purple-400 flex items-center mb-3 sm:mb-0">
          <CubeTransparentIcon className="w-7 h-7 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-purple-400" />
          Gerenciar Estoque
        </h2>
        <button
          onClick={onAddItem}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-3 sm:py-2.5 sm:px-4 rounded-md flex items-center justify-center transition-colors text-xs sm:text-sm shadow-md hover:shadow-lg"
        >
          <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" /> Adicionar Novo Item
        </button>
      </div>

      {isLoading && stockItems.length === 0 ? (
        <div className="flex-grow flex items-center justify-center text-gray-400">
          <LoadingSpinner size="w-10 h-10 sm:w-12 sm:h-12" />
          <p className="ml-2 sm:ml-3">Carregando itens do estoque...</p>
        </div>
      ) : stockItems.length === 0 ? (
        <div className="text-center text-gray-400 py-10 flex-grow flex flex-col items-center justify-center bg-gray-800/50 rounded-md">
            <InformationCircleIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-500 mb-4 sm:mb-6" />
            <p className="text-lg sm:text-xl font-semibold text-gray-200 mb-2">Nenhum item em estoque.</p>
            <p className="text-xs sm:text-sm">Clique em "Adicionar Novo Item" para começar.</p>
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800 flex-grow">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nome</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden md:table-cell">Tipo</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden lg:table-cell">Localização</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden sm:table-cell">Nº Série</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden md:table-cell">Patrimônio</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {stockItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-purple-300 truncate max-w-[150px] sm:max-w-xs" title={item.name}>{item.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 hidden md:table-cell">{item.type}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === EquipmentStatus.EM_ESTOQUE ? 'bg-indigo-800 text-indigo-200' :
                        item.status === EquipmentStatus.PEDIDO ? 'bg-yellow-800 text-yellow-200' :
                        'bg-gray-700 text-gray-300'
                    }`}>
                        {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 truncate max-w-[120px] sm:max-w-xs hidden lg:table-cell" title={item.location || ''}>{item.location || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 hidden sm:table-cell">{item.serial_number || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 hidden md:table-cell">{item.patrimony_number || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => onEditItem(item.id)}
                      className="text-purple-400 hover:text-purple-300 p-1 rounded-md hover:bg-gray-700 transition-colors"
                      title="Editar Item"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-auto pt-4 sm:pt-6 text-center print:hidden">
        <p className="text-xs text-gray-500">Funcionalidades avançadas como filtros e paginação em desenvolvimento.</p>
      </div>
    </div>
  );
};

export default InventoryStockList;
